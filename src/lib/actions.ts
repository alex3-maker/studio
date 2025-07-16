
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

// This helper function reconstructs the nested options array from the flat FormData
function processFormDataWithOptions(formData: FormData) {
    const data: { [key: string]: any } = {};
    const options: any[] = [];

    for (const [key, value] of formData.entries()) {
        const optionMatch = key.match(/^options\.(\d+)\.(.+)$/);

        if (optionMatch) {
            const [, indexStr, field] = optionMatch;
            const index = parseInt(indexStr, 10);
            
            if (!options[index]) {
                options[index] = {};
            }
            options[index][field] = value;
        } else {
            data[key] = value;
        }
    }
    
    data.options = options.filter(opt => opt && opt.title); // Filter out empty/undefined slots
    return data;
}


async function runModeration(data: { title:string; options:{ title:string }[] }): Promise<{ success:boolean; message?:string; errors?:{ moderation:string } }> {
  // const { title, options } = data;
  // const titleModeration = await moderateContent({ content: title, contentType: 'text' });
  // if (!titleModeration.isSafe) {
  //   return {
  //     success: false,
  //     message: `El título del duelo fue marcado como inapropiado. Razones: ${titleModeration.reasons.join(', ')}`,
  //     errors: { moderation: `El título del duelo fue marcado como inapropiado.` },
  //   };
  // }

  // for (const option of options) {
  //   const optionTitleModeration = await moderateContent({ content: option.title, contentType: 'text' });
  //   if (!optionTitleModeration.isSafe) {
  //     return {
  //       success: false,
  //       message: `El título de la opción "${option.title}" fue marcado como inapropiado. Razones: ${optionTitleModeration.reasons.join(', ')}`,
  //       errors: { moderation: `El título de la opción "${option.title}" es inapropiado.` },
  //     };
  //   }
  // }
  return { success: true };
}


export async function createDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  const rawFormData = processFormDataWithOptions(formData);
  
  const validatedFields = createDuelSchema.safeParse(rawFormData);
  
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
  
  const { type, title, options, description, startsAt, endsAt, userKeys } = validatedFields.data;
  
  try {
    const moderationResult = await runModeration({ title, options });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }
    
    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');

    const hasEnoughKeys = (userKeys || 0) >= DUEL_CREATION_COST;
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
      options: options.map((opt, i) => ({
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
  const rawFormData = processFormDataWithOptions(formData);
  
  if (!rawFormData.id) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  const validatedFields = createDuelSchema.safeParse(rawFormData);

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

  const { title, options, description, startsAt, endsAt, type } = validatedFields.data;

  try {
    const moderationResult = await runModeration({ title, options });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }

    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${rawFormData.id}/edit`);
    revalidatePath('/panel/mis-duelos');
    revalidatePath(`/panel/mis-duelos/${rawFormData.id}/edit`);

    const updatedDuel: Partial<Duel> & { id: string } = {
      id: rawFormData.id,
      type,
      title,
      description: description || '',
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      options: options.map((opt, index) => ({
        id: opt.id || `opt-${rawFormData.id}-${index}`, 
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
