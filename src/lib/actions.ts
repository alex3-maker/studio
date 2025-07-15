'use server';

import { z } from 'zod';
import { createDuelSchema } from '@/lib/schemas';
import { moderateContent } from '@/ai/flows/moderate-content';

type FormState = {
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
  
  const { title, options } = validatedFields.data;

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

    // Moderate each option's title and image URL (as text)
    for (const option of options) {
      const optionTitleModeration = await moderateContent({ content: option.title, contentType: 'text' });
      if (!optionTitleModeration.isSafe) {
        return {
          message: `The option title "${option.title}" was flagged as unsafe. Reasons: ${optionTitleModeration.reasons.join(', ')}`,
          success: false,
          errors: { moderation: `Option title "${option.title}" was flagged.` },
        };
      }
      // Note: The current moderation flow can take image URLs.
      // In a real scenario with file uploads, you'd convert the image to a data URI.
      const optionImageModeration = await moderateContent({ content: option.imageUrl, contentType: 'image' });
      if (!optionImageModeration.isSafe) {
        return {
          message: `The image for "${option.title}" was flagged as unsafe. Reasons: ${optionImageModeration.reasons.join(', ')}`,
          success: false,
          errors: { moderation: `Image for "${option.title}" was flagged.` },
        };
      }
    }

    // Here you would save the data to your database.
    console.log('Duel created successfully:', validatedFields.data);

    return {
      message: 'Duel created successfully!',
      success: true,
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
