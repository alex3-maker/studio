
'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { Duel } from './types';

export type FormState = {
  message: string;
  success: boolean;
  errors?: {
    title?: string[];
    description?: string[];
    type?: string[];
    options?: (string | undefined)[] | string;
    moderation?: string;
    _form?: string[];
  };
  newDuel?: Duel;
  updatedDuel?: Partial<Duel>; // Can be partial as we merge it in the context
};

function getFormData(formData: FormData) {
  return {
    id: formData.get('id') as string | undefined,
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    options: [
      { title: formData.get('options.0.title'), imageUrl: formData.get('options.0.imageUrl') },
      { title: formData.get('options.1.title'), imageUrl: formData.get('options.1.imageUrl') }
    ]
  };
}

async function runModeration(data: { title: string; options: { title: string }[] }): Promise<{ success: boolean; message?: string; errors?: { moderation: string } }> {
  const { title, options } = data;
  const titleModeration = await moderateContent({ content: title, contentType: 'text' });
  if (!titleModeration.isSafe) {
    return {
      success: false,
      message: `El título del duelo fue marcado como inapropiado. Razones: ${titleModeration.reasons.join(', ')}`,
      errors: { moderation: `El título del duelo fue marcado como inapropiado.` },
    };
  }

  for (const option of options) {
    const optionTitleModeration = await moderateContent({ content: option.title, contentType: 'text' });
    if (!optionTitleModeration.isSafe) {
      return {
        success: false,
        message: `El título de la opción "${option.title}" fue marcado como inapropiado. Razones: ${optionTitleModeration.reasons.join(', ')}`,
        errors: { moderation: `El título de la opción "${option.title}" es inapropiado.` },
      };
    }
  }
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
  
  const { title, options, description, type } = validatedFields.data;

  try {
    const moderationResult = await runModeration({ title, options });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }
    
    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');
    
    // In a real app, you would add this to a database.
    const newDuel: Duel = {
      id: `duel-${Date.now()}`,
      title,
      description: description || '',
      type,
      status: 'active',
      creator: {
        id: 'user-1',
        name: 'Alex Doe',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop'
      },
      options: [
        { id: `opt-${Date.now()}-a`, title: options[0].title, imageUrl: options[0].imageUrl, votes: 0 },
        { id: `opt-${Date.now()}-b`, title: options[1].title, imageUrl: options[1].imageUrl, votes: 0 },
      ],
    };

    return {
      message: '¡Duelo creado con éxito!',
      success: true,
      newDuel: newDuel
    };

  } catch (error) {
    console.error('Error creando duelo:', error);
    return {
      message: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      success: false,
      errors: { _form: ['Error del servidor.'] },
    };
  }
}

export async function updateDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawFormData = getFormData(formData);
  
  if (!rawFormData.id) {
    return { success: false, message: "ID del duelo no encontrado." };
  }

  const validatedFields = createDuelSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Validación fallida. Por favor, revisa tus datos.',
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, options, description } = validatedFields.data;

  try {
    const moderationResult = await runModeration({ title, options });
    if (!moderationResult.success) {
      return { ...moderationResult, message: moderationResult.message! };
    }

    revalidatePath('/admin/duels');
    revalidatePath(`/admin/duels/${rawFormData.id}/edit`);

    // This is where you would update the duel in your database.
    // For this demo, we'll just construct the updated duel object.
    // The votes will be merged in the context, not handled here.
    const updatedDuel: Partial<Duel> = {
      id: rawFormData.id,
      title,
      description: description || '',
      options: [
        { id: `opt-${rawFormData.id}-a`, title: options[0].title, imageUrl: options[0].imageUrl, votes: 0 }, // Votes are preserved in context
        { id: `opt-${rawFormData.id}-b`, title: options[1].title, imageUrl: options[1].imageUrl, votes: 0 },
      ],
    };

    return {
      message: '¡Duelo actualizado con éxito!',
      success: true,
      updatedDuel: updatedDuel,
    };

  } catch (error) {
    console.error('Error actualizando duelo:', error);
    return {
      message: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      success: false,
      errors: { _form: ['Error del servidor.'] },
    };
  }
}
