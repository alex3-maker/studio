
'use server';

/**
 * @fileOverview Content moderation flow using OpenAI to filter out NSFW content.
 *
 * - moderateContent - A function that moderates content and returns a moderation result.
 */

import {ai} from '@/ai/genkit';
import Handlebars from 'handlebars';
import type { ModerateContentInput, ModerateContentOutput } from '@/lib/types';
import { ModerateContentInputSchema, ModerateContentOutputSchema } from '@/lib/types';


export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
  return moderateContentFlow(input);
}

const moderateContentPrompt = ai.definePrompt({
  name: 'moderateContentPrompt',
  input: {schema: ModerateContentInputSchema},
  output: {schema: ModerateContentOutputSchema},
  prompt: `You are a content moderation AI.  Your job is to determine if the content provided is safe for display on a public website.

  Here are the safety guidelines:
  - No sexually explicit content
  - No violent content
  - No hate speech
  - No dangerous content

  If the content violates these guidelines, set isSafe to false and provide specific reasons in the reasons array.

  Content type: {{{contentType}}}
  Content: {{#ifEquals contentType \"image\"}}{{media url=content}}{{else}}{{{content}}}{{/ifEquals}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

// Handlebars helper function to check equality (needed because Handlebars doesn't have built-in equality check)
// Note: This should be defined outside the ai.defineFlow block and should be registered before the flow definition.

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  // @ts-expect-error
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

const moderateContentFlow = ai.defineFlow(
  {
    name: 'moderateContentFlow',
    inputSchema: ModerateContentInputSchema,
    outputSchema: ModerateContentOutputSchema,
  },
  async input => {
    const {output} = await moderateContentPrompt(input);
    return output!;
  }
);
