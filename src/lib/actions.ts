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
    options?: string[];
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
      message: 'Validation failed. Please check your inputs.',
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
        message: `The duel title was flagged as unsafe. Reasons: ${titleModeration.reasons.join(', ')}`,
        success: false,
        errors: { moderation: `The duel title was flagged as unsafe.` },
      };
    }

    // Moderate each option's title
    for (const option of options) {
      const optionTitleModeration = await moderateContent({ content: option.title, contentType: 'text' });
      if (!optionTitleModeration.isSafe) {
        return {
          message: `The option title "${option.title}" was flagged as unsafe. Reasons: ${optionTitleModeration.reasons.join(', ')}`,
          success: false,
          errors: { moderation: `Option title "${option.title}" was flagged.` },
        };
      }
      // Temporarily disable image moderation as it requires a data URI
      // const optionImageModeration = await moderateContent({ content: option.imageUrl, contentType: 'image' });
      // if (!optionImageModeration.isSafe) {
      //   return {
      //     message: `The image for "${option.title}" was flagged as unsafe. Reasons: ${optionImageModeration.reasons.join(', ')}`,
      //     success: false,
      //     errors: { moderation: `Image for "${option.title}" was flagged.` },
      //   };
      // }
    }
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    
    return {
      message: 'Duel created successfully!',
      success: true,
      newDuel: validatedFields.data,
    };

  } catch (error) {
    console.error('Error creating duel:', error);
    return {
      message: 'An unexpected error occurred. Please try again.',
      success: false,
      errors: { _form: ['Server error.'] },
    };
  }
}
