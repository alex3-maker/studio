
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
    title?: string[];
    description?: string[];
    type?: string[];
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

function getFormData(formData: FormData) {
  const startsAt = formData.get('startsAt') as string;
  const endsAt = formData.get('endsAt') as string;

  return {
    id: formData.get('id') as string | undefined,
    userKeys: Number(formData.get('userKeys') || '0'),
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as "A_VS_B" | "LIST" | "KING_OF_THE_HILL",
    options: [
      { id: formData.get('options.0.id') as string | undefined, title: formData.get('options.0.title') as string, imageUrl: formData.get('options.0.imageUrl') as string, affiliateUrl: formData.get('options.0.affiliateUrl') as string },
      { id: formData.get('options.1.id') as string | undefined, title: formData.get('options.1.title') as string, imageUrl: formData.get('options.1.imageUrl') as string, affiliateUrl: formData.get('options.1.affiliateUrl') as string }
    ],
    startsAt: startsAt ? new Date(startsAt) : undefined,
    endsAt: endsAt ? new Date(endsAt) : undefined,
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
  
  const rawFormData = getFormData(formData);
  const validatedFields = createDuelSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      message: 'Validación fallida. Por favor, revisa tus datos.',
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { title, options, description, type, startsAt, endsAt, userKeys } = validatedFields.data;

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
      title,
      description: description || '',
      type,
      status, // Will be re-evaluated in the context
      createdAt: formatISO(new Date()),
      startsAt: formatISO(startsAt),
      endsAt: formatISO(endsAt),
      creator: {
        id: 'user-1',
        name: 'Alex Doe',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'
      },
      options: [
        { id: `opt-${Date.now()}-a`, title: options[0].title, imageUrl: options[0].imageUrl || undefined, affiliateUrl: options[0].affiliateUrl || undefined, votes: 0 },
        { id: `opt-${Date.now()}-b`, title: options[1].title, imageUrl: options[1].imageUrl || undefined, affiliateUrl: options[1].affiliateUrl || undefined, votes: 0 },
      ],
    };

    const message = hasEnoughKeys
      ? '¡Duelo creado con éxito!'
      : 'No tienes suficientes llaves. El duelo se ha guardado como borrador.';

    return {
      message: message,
      success: true,
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
  const rawFormData = getFormData(formData);
  
  if (!rawFormData.id) {
    return { success: false, message: "ID del duelo no encontrado.", errors: { _form: ["ID del duelo no encontrado."] } };
  }

  const validatedFields = createDuelSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Validación fallida. Por favor, revisa tus datos.',
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
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
        // Votes are preserved from the original state in the context, so no need to set them here
      })) as [any, any] // Type assertion to satisfy partial update
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
