
'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { Duel } from './types';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import crypto from 'crypto';

export type FormState = {
  message: string;
  success: boolean;
  errors?: {
    type?: string[];
    title?: string[];
    description?: string[];
    options?: (string | undefined)[] | string;
    startsAt?: string[];
    endsAt?: string[];
    moderation?: string;
    _form?: string[];
  };
  newDuel?: Duel;
  updatedDuel?: Duel;
};

const DUEL_CREATION_COST = 5;

function getClientIp(): string {
  const h = headers();
  // When running behind a proxy (like in most cloud environments), the client IP is in this header.
  const xfwd = h.get('x-forwarded-for');
  if (xfwd) {
    // The header can contain a list of IPs, the first one is the client.
    return xfwd.split(',')[0].trim();
  }
  // For direct connections or local development, fall back to other headers or a default.
  const rip = h.get('x-real-ip');
  return rip ?? '127.0.0.1';
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function castVoteAction({ duelId, optionId }: { duelId: string; optionId: string; }): Promise<{ awardedKey: boolean; updatedDuel: Duel | null; error?: string; voteRegisteredForGuest?: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    
    try {
      const duel = await prisma.duel.findUnique({ where: { id: duelId } });
      if (!duel || duel.status !== 'ACTIVE') {
          return { error: "Este duelo no está activo o no existe.", awardedKey: false, updatedDuel: null };
      }

      if (userId) { // Authenticated user
          const existingVote = await prisma.vote.findUnique({
              where: { userId_duelId: { userId, duelId } },
          });
          if (existingVote) {
              return { error: "Ya has votado en este duelo.", awardedKey: false, updatedDuel: null };
          }
          await prisma.vote.create({
              data: { userId, duelId, optionId }
          });
      } else { // Guest user
          const ipHash = hashIp(getClientIp());
          
          const existingGuestVote = await prisma.guestVote.findUnique({
              where: { dueliax_guest_votes_duel_ip_unique: { duelId, ipHash } }
          });

          if (existingGuestVote) {
              return { error: "Ya has votado en este duelo como invitado.", awardedKey: false, updatedDuel: null };
          }
          
          await prisma.guestVote.create({
            data: {
              duelId: duelId,
              optionId: optionId,
              ipHash: ipHash
            }
          });
      }
      
      // Increment vote count on the option
      await prisma.duelOption.update({
          where: { id: optionId },
          data: { votes: { increment: 1 } },
      });
      
      let awardedKey = false;
      if(userId) {
          await prisma.user.update({
              where: { id: userId },
              data: { 
                  votesCast: { increment: 1 },
                  keys: { increment: 1 }
              }
          });
          awardedKey = true;
      }

      // Fetch the updated duel to return to the client
      const updatedDuelResult = await prisma.duel.findUnique({
          where: { id: duelId },
          include: { options: { orderBy: { title: 'asc' }}, creator: true }
      });
      
      if (!updatedDuelResult) {
        return { error: "No se pudo encontrar el duelo después de votar.", awardedKey: false, updatedDuel: null };
      }
      
      revalidatePath('/');
      
      return {
          awardedKey,
          voteRegisteredForGuest: !userId,
          updatedDuel: {
            ...updatedDuelResult,
            options: updatedDuelResult.options || [],
            creator: updatedDuelResult.creator ? { id: updatedDuelResult.creator.id, name: updatedDuelResult.creator.name || 'N/A', avatarUrl: updatedDuelResult.creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
          } as Duel,
      };

    } catch (e: any) {
        console.error('Error casting vote:', e);
        return { error: `Ocurrió un error en el servidor: ${e.message}`, awardedKey: false, updatedDuel: null };
    }
}


function processFormDataWithOptions(formData: FormData) {
  const data: Record<string, any> = {};
  const options: Record<number, Record<string, any>> = {};
  const optionRegex = /options\[(\d+)\]\.(id|title|imageUrl|affiliateUrl)/;

  for (const [key, value] of formData.entries()) {
    const match = key.match(optionRegex);
    if (match) {
      const index = parseInt(match[1], 10);
      const field = match[2];
      if (!options[index]) {
        options[index] = {};
      }
      options[index][field] = value;
    } else {
      data[key] = value;
    }
  }

  data.options = Object.values(options);
    
  return data;
}


async function runModeration(data: { title:string; options:{ title:string }[] }): Promise<{ success:boolean; message?:string; errors?:{ moderation:string } }> {
  // Moderation logic is currently disabled for simplicity, but can be re-enabled here.
  return { success: true };
}

export async function createDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: 'No autenticado.' };
  }
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }});
  if (!user) {
    return { success: false, message: 'Usuario no encontrado.' };
  }

  const rawData = processFormDataWithOptions(formData);
  
  const validatedFields = createDuelSchema.safeParse({
      ...rawData,
      startsAt: rawData.startsAt,
      endsAt: rawData.endsAt,
  });
  
  if (!validatedFields.success) {
    const errorDetails = JSON.stringify(validatedFields.error.flatten(), null, 2);
    return {
      message: 'Validación fallida. Por favor, revisa tus datos.',
      success: false,
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: [`Error de validación. Detalles: ${errorDetails}`],
      }
    };
  }
  
  const { type, title, options, description, startsAt, endsAt } = validatedFields.data;
  
  try {
    const moderationResult = await runModeration({ title, options });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }

    const hasEnoughKeys = user.keys >= DUEL_CREATION_COST;
    const status = hasEnoughKeys ? 'SCHEDULED' : 'DRAFT'; 
    
    // Create duel and options in a transaction
    const newDuel = await prisma.$transaction(async (tx) => {
      const createdDuel = await tx.duel.create({
        data: {
          type,
          title,
          description,
          creatorId: userId,
          startsAt,
          endsAt,
          status,
          options: {
            create: options.map(opt => ({
              title: opt.title,
              imageUrl: opt.imageUrl,
              affiliateUrl: opt.affiliateUrl,
            }))
          }
        },
        include: { options: true, creator: true }
      });

      if (status === 'SCHEDULED') {
        await tx.user.update({
          where: { id: userId },
          data: { keys: { decrement: DUEL_CREATION_COST } }
        });
      }
      
      await tx.user.update({
        where: { id: userId },
        data: { duelsCreated: { increment: 1 } }
      });

      return createdDuel;
    });

    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');
    
    return {
      success: true,
      message: '¡Tu duelo ha sido guardado! El estado final (borrador o activo) dependerá de tus llaves.',
      newDuel: { 
          ...newDuel, 
          options: newDuel.options || [],
          creator: newDuel.creator ? { id: newDuel.creator.id, name: newDuel.creator.name || 'N/A', avatarUrl: newDuel.creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
      } as Duel,
    };
    
  } catch (error) {
    console.error('Error creando duelo:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      message: `Ocurrió un error inesperado. Por favor, inténtalo de nuevo. Detalle: ${errorMessage}`,
      success: false,
      errors: { _form: [`Ocurrió un error inesperado. Por favor, inténtalo de nuevo. Detalle: ${errorMessage}`] },
    };
  }
}

export async function updateDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {

  const rawData = processFormDataWithOptions(formData);
  const duelId = rawData.id as string;
  
  if (!duelId) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  const validatedFields = createDuelSchema.safeParse({
      ...rawData,
      startsAt: rawData.startsAt,
      endsAt: rawData.endsAt,
  });

  if (!validatedFields.success) {
    const errorDetails = JSON.stringify(validatedFields.error.flatten().fieldErrors);
    return {
      message: 'Validación fallida. Por favor, revisa tus datos.',
      success: false,
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        _form: [`Error de validación. Detalles: ${errorDetails}`],
      }
    };
  }

  const { title, options: validatedOptions, description, startsAt, endsAt, type } = validatedFields.data;

  try {
    const moderationResult = await runModeration({ title, options: validatedOptions });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }
    
    const updatedDuel = await prisma.$transaction(async (tx) => {
        const duel = await tx.duel.update({
            where: { id: duelId },
            data: {
                title,
                description,
                startsAt,
                endsAt,
                type,
            },
            include: { creator: true }
        });

        // Delete existing options and create new ones
        await tx.duelOption.deleteMany({ where: { duelId } });
        const newOptions = await tx.duelOption.createManyAndReturn({
            data: validatedOptions.map(opt => ({
                duelId,
                title: opt.title,
                imageUrl: opt.imageUrl,
                affiliateUrl: opt.affiliateUrl,
            }))
        });

        return { ...duel, options: newOptions };
    });

    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${duelId}/edit`);
    revalidatePath('/panel/mis-duelos');
    revalidatePath(`/panel/mis-duelos/${duelId}/edit`);

    return {
      success: true,
      message: '¡Duelo actualizado con éxito!',
      updatedDuel: {
          ...updatedDuel, 
          creator: updatedDuel.creator ? { id: updatedDuel.creator.id, name: updatedDuel.creator.name || 'N/A', avatarUrl: updatedDuel.creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
      } as Duel
    }

  } catch (error) {
    console.error('Error actualizando duelo:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      message: `Ocurrió un error inesperado al actualizar: ${errorMessage}`,
      success: false,
      errors: { _form: [`Error del servidor al actualizar. Detalle: ${errorMessage}`] },
    };
  }
}
