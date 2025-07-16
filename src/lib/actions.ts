
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

// Helper function to extract and construct structured data from FormData
function getStructuredFormData(formData: FormData) {
    const rawData: { [key: string]: any } = Object.fromEntries(formData);
    const options: any[] = [];
    
    // A more robust way to gather options
    for (const [key, value] of formData.entries()) {
        const match = key.match(/options\[(\d+)\]\.(.+)/);
        if (match) {
            const index = parseInt(match[1], 10);
            const property = match[2];
            if (!options[index]) {
                options[index] = {};
            }
            options[index][property] = value;
        }
    }

    return {
        id: rawData.id as string | undefined,
        type: rawData.type as 'A_VS_B' | 'LIST',
        userKeys: Number(rawData.userKeys || '0'),
        title: rawData.title as string,
        description: rawData.description as string,
        options: options,
        startsAt: new Date(rawData.startsAt as string),
        endsAt: new Date(rawData.endsAt as string),
    };
}


async function runModeration(data: { title: string; options: { title: string }[] }): Promise<{ success: boolean; message?: string; errors?: { moderation: string } }> {
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
  
  const rawFormData = getStructuredFormData(formData);
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

    const hasEnoughKeys = userKeys >= DUEL_CREATION_COST;
    const status: Duel['status'] = hasEnoughKeys ? 'scheduled' : 'draft'; // Let the context determine if it's active

    const newDuel: Duel = {
      id: `duel-${Date.now()}`,
      type,
      title,
      description: description || '',
      status, // Will be re-evaluated in the context
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
  const rawFormData = getStructuredFormData(formData);
  
  if (!rawFormData.id) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  // For updates, we can use a slightly more lenient schema or just parse the parts we need.
  // The type cannot be changed, so we don't need to validate it again.
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

  const { title, options, description, startsAt, endsAt } = validatedFields.data;

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
      title,
      description: description || '',
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      options: rawFormData.options.map((opt, index) => ({
        id: opt.id || `opt-${rawFormData.id}-${index}`, // Ensure option has an id
        title: options[index].title,
        imageUrl: options[index].imageUrl || undefined,
        affiliateUrl: options[index].affiliateUrl || undefined,
        votes: 0, // IMPORTANT: Votes preservation is handled in the context.
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
