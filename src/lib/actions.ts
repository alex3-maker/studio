
'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { Duel } from './types';
import { formatISO } from 'date-fns';

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
  updatedDuel?: Partial<Duel> & { id: string };
};

const DUEL_CREATION_COST = 5;

// Helper to process FormData and reconstruct nested options
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
  // Moderation logic is disabled for now to simplify debugging.
  return { success: true };
}

export async function createDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  const rawData = processFormDataWithOptions(formData);
  
  const validatedFields = createDuelSchema.safeParse({
      ...rawData,
      userKeys: Number(rawData.userKeys), // Ensure userKeys is a number
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
  
  const { type, title, options: validatedOptions, description, startsAt, endsAt, userKeys } = validatedFields.data;
  
  try {
    const moderationResult = await runModeration({ title, options: validatedOptions });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }
    
    const hasEnoughKeys = userKeys >= DUEL_CREATION_COST;
    const status: Duel['status'] = hasEnoughKeys ? 'scheduled' : 'draft'; 

    const newDuel: Duel = {
      id: `duel-${Date.now()}-${Math.random()}`,
      type,
      title,
      description: description || '',
      status, 
      createdAt: formatISO(new Date()),
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      creator: {
        id: 'user-1',
        name: 'Alex Doe',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'
      },
      options: validatedOptions.map((opt, i) => ({
        id: `opt-${Date.now()}-${i}`,
        title: opt.title,
        imageUrl: opt.imageUrl || undefined,
        affiliateUrl: opt.affiliateUrl || undefined,
        votes: 0,
      }))
    };

    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');
    
    return {
      success: true,
      message: status === 'draft' 
        ? '¡Tu duelo ha sido guardado como borrador!' 
        : '¡Duelo creado y activado con éxito!',
      newDuel: newDuel
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
  
  if (!rawData.id) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  const validatedFields = createDuelSchema.safeParse({
      ...rawData,
      userKeys: Number(rawData.userKeys || 0), // Ensure userKeys is a number
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

  const { title, options: validatedOptions, description, startsAt, endsAt, type } = validatedFields.data;

  try {
    const moderationResult = await runModeration({ title, options: validatedOptions });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }

    const updatedDuel: Partial<Duel> & { id: string } = {
      id: rawData.id,
      type,
      title,
      description: description || '',
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      options: validatedOptions.map((opt, index) => ({
        id: opt.id || `opt-${rawData.id}-${index}`, 
        title: opt.title,
        imageUrl: opt.imageUrl || undefined,
        affiliateUrl: opt.affiliateUrl || undefined,
        votes: 0, 
      }))
    };
    
    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${rawData.id}/edit`);
    revalidatePath('/panel/mis-duelos');
    revalidatePath(`/panel/mis-duelos/${rawData.id}/edit`);

    return {
      success: true,
      message: '¡Duelo actualizado con éxito!',
      updatedDuel: updatedDuel
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
