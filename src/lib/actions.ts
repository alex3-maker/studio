'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { CreateDuelFormValues } from '@/lib/schemas';
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
};

export async function createDuelAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  
  const rawFormData = {
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    options: [
      { title: formData.get('options.0.title'), imageUrl: formData.get('options.0.imageUrl') },
      { title: formData.get('options.1.title'), imageUrl: formData.get('options.1.imageUrl') }
    ]
  }

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
    const titleModeration = await moderateContent({ content: title, contentType: 'text' });
    if (!titleModeration.isSafe) {
      return {
        message: `El título del duelo fue marcado como inapropiado. Razones: ${titleModeration.reasons.join(', ')}`,
        success: false,
        errors: { moderation: `El título del duelo fue marcado como inapropiado.` },
      };
    }

    for (const option of options) {
      const optionTitleModeration = await moderateContent({ content: option.title, contentType: 'text' });
      if (!optionTitleModeration.isSafe) {
        return {
          message: `El título de la opción "${option.title}" fue marcado como inapropiado. Razones: ${optionTitleModeration.reasons.join(', ')}`,
          success: false,
          errors: { moderation: `El título de la opción "${option.title}" es inapropiado.` },
        };
      }
    }
    
    revalidatePath('/');
    revalidatePath('/panel/mis-duelos');
    
    // The duel is created here, but not added to a DB. It will be added to the state on the client.
    const newDuel: Duel = {
      id: `duel-${Date.now()}`,
      title,
      description: description || '',
      type,
      status: 'active',
      creator: { // In a real app, this would come from the session
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
