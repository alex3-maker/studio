
'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { Duel } from './types';
import { formatISO } from 'date-fns';
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
  newDuel?: Omit<Duel, 'id' | 'creator' | 'createdAt' | 'status'>;
  updatedDuel?: Partial<Duel> & { id: string };
};

const DUEL_CREATION_COST = 5;

function getClientIp(): string {
  const h = headers();
  const xfwd = h.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0].trim();
  const rip = h.get('x-real-ip');
  return rip ?? '127.0.0.1'; // Fallback for local dev
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function castVoteAction({ duelId, optionId }: { duelId: string; optionId: string; }): Promise<{ awardedKey: boolean; updatedDuel: Duel | null; error?: string; voteRegistered?: boolean }> {
    const session = await auth();
    const userId = session?.user?.id;
    
    const duel = await prisma.duel.findUnique({ where: { id: duelId }, include: { options: true } });
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
        
        const existingGuestVote = await prisma.dueliax_guest_votes.findUnique({
            where: { duel_id_ip_hash: { duel_id: duelId, ip_hash: ipHash } }
        });

        if (existingGuestVote) {
            return { error: "Ya has votado en este duelo.", awardedKey: false, updatedDuel: null };
        }
        
        await prisma.dueliax_guest_votes.create({
          data: {
            id: `guestvote-${Date.now()}`,
            duel_id: duelId,
            option_id: optionId,
            ip_hash: ipHash
          }
        });
    }
    
    // Increment vote count on the option in the JSON field
    const updatedOptions = duel.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
    );

    const updatedDuelResult = await prisma.duel.update({
        where: { id: duelId },
        data: { options: updatedOptions as any }, // Cast to any to match Prisma's expected JSON type
        include: { options: true }
    });
    
    // Update user stats if logged in
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

    revalidatePath('/');
    
    const creator = await prisma.user.findUnique({ where: { id: updatedDuelResult.creatorId } });
    
    return {
        awardedKey,
        voteRegistered: !userId,
        updatedDuel: {
          ...updatedDuelResult,
          options: updatedDuelResult.options || [],
          creator: creator ? { id: creator.id, name: creator.name || 'N/A', avatarUrl: creator.image || null } : { id: 'unknown', name: 'Usuario Desconocido', avatarUrl: null }
        } as Duel,
    };
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
          id: `duel-${Date.now()}`,
          type,
          title,
          description,
          creatorId: userId,
          startsAt,
          endsAt,
          status,
          options: {
            create: options.map(opt => ({
              id: `opt-${Date.now()}-${Math.random()}`,
              title: opt.title,
              imageUrl: opt.imageUrl,
              affiliateUrl: opt.affiliateUrl,
            }))
          }
        },
        include: { options: true }
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
      newDuel: { ...newDuel, options: newDuel.options || [] } as any, // Cast to satisfy FormState
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
    
    // In a transaction, update the duel and its options
    await prisma.$transaction(async (tx) => {
        await tx.duel.update({
            where: { id: duelId },
            data: {
                title,
                description,
                startsAt,
                endsAt,
                type,
            }
        });

        // Delete existing options and create new ones
        await tx.duelOption.deleteMany({ where: { duelId } });
        await tx.duelOption.createMany({
            data: validatedOptions.map(opt => ({
                id: opt.id || `opt-${duelId}-${Math.random()}`,
                duelId,
                title: opt.title,
                imageUrl: opt.imageUrl,
                affiliateUrl: opt.affiliateUrl,
            }))
        });
    });

    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${duelId}/edit`);
    revalidatePath('/panel/mis-duelos');
    revalidatePath(`/panel/mis-duelos/${duelId}/edit`);

    return {
      success: true,
      message: '¡Duelo actualizado con éxito!',
      updatedDuel: { id: duelId, ...validatedFields.data } as any,
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
