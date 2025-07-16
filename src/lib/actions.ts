
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

// This function is no longer needed and will be removed.
// The logic will be handled directly and more robustly inside the actions.

async function runModeration(data: { title:string; options:{ title:string }[] }): Promise<{ success:boolean; message?:string; errors?:{ moderation:string } }> {
  // Moderation logic is disabled for now to simplify debugging.
  return { success: true };
}

export async function createDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  // Robust data processing
  const rawData: Record<string, any> = {};
  const options: any[] = [];
  const formDataEntries = Array.from(formData.entries());

  for (const [key, value] of formDataEntries) {
    const optionMatch = key.match(/options\.(\d+)\.(.*)/);
    if (optionMatch) {
      const index = parseInt(optionMatch[1], 10);
      const field = optionMatch[2];
      if (!options[index]) {
        options[index] = {};
      }
      options[index][field] = value;
    } else {
      rawData[key] = value;
    }
  }
  rawData.options = options.filter(opt => opt && typeof opt === 'object');

  const validatedFields = createDuelSchema.safeParse(rawData);
  
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
    
    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');

    const hasEnoughKeys = Number(userKeys || 0) >= DUEL_CREATION_COST;
    const status: Duel['status'] = hasEnoughKeys ? 'scheduled' : 'draft'; 

    const newDuel: Duel = {
      id: `duel-${Date.now()}`,
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

    const message = hasEnoughKeys
      ? '¡Duelo creado con éxito!'
      : 'No tienes suficientes llaves. El duelo se ha guardado como borrador.';

    return {
      message: message,
      success: true,
      newDuel: newDuel,
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
  // Robust data processing
  const rawData: Record<string, any> = {};
  const options: any[] = [];
  const formDataEntries = Array.from(formData.entries());

  for (const [key, value] of formDataEntries) {
    const optionMatch = key.match(/options\.(\d+)\.(.*)/);
    if (optionMatch) {
      const index = parseInt(optionMatch[1], 10);
      const field = optionMatch[2];
      if (!options[index]) {
        options[index] = {};
      }
      options[index][field] = value;
    } else {
      rawData[key] = value;
    }
  }
  rawData.options = options.filter(opt => opt && typeof opt === 'object');
  
  if (!rawData.id) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  const validatedFields = createDuelSchema.safeParse(rawData);

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

    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${rawData.id}/edit`);
    revalidatePath('/panel/mis-duelos');
    revalidatePath(`/panel/mis-duelos/${rawData.id}/edit`);

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
    
    return {
      message: '¡Duelo actualizado con éxito!',
      success: true,
      updatedDuel: updatedDuel,
    };

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
