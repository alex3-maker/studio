'use server';

import { moderateContent } from '@/ai/flows/moderate-content';
import { createDuelSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';
import type { CreateDuelFormValues } from '@/lib/schemas';

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
  newDuel?: CreateDuelFormValues & { options: { title: string, imageUrl: string }[] };
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
    // Moderate duel title
    const titleModeration = await moderateContent({ content: title, contentType: 'text' });
    if (!titleModeration.isSafe) {
      return {
        message: `El título del duelo fue marcado como inapropiado. Razones: ${titleModeration.reasons.join(', ')}`,
        success: false,
        errors: { moderation: `El título del duelo fue marcado como inapropiado.` },
      };
    }

    // Moderate each option's title
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
    revalidatePath('/panel');
    
    return {
      message: '¡Duelo creado con éxito!',
      success: true,
      newDuel: validatedFields.data,
    };

  } catch (error) {
    console.error('Error creating duel:', error);
    return {
      message: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
      success: false,
      errors: { _form: ['Error del servidor.'] },
    };
  }
}
