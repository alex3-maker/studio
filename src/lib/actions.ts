
'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { Duel } from './types';
import { formatISO } from 'date-fns';
import { auth } from '@/app/api/auth/[...nextauth]/route';

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
  // We no longer pass the full duel object, just the data needed for the context to create it
  newDuel?: Omit<Duel, 'id' | 'creator' | 'createdAt' | 'status'>;
  updatedDuel?: Partial<Duel> & { id: string };
};

const DUEL_CREATION_COST = 5;

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
    
    // The duel object that the context needs to create the full duel
    const newDuelData: Omit<Duel, 'id' | 'creator' | 'createdAt' | 'status'> = {
      type,
      title,
      description: description || '',
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      options: options.map((opt, i) => ({
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
      message: '¡Tu duelo ha sido guardado! El estado final (borrador o activo) dependerá de tus llaves.',
      newDuel: newDuelData,
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
        votes: 0, // Votes are preserved in AppContext, not reset here
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
