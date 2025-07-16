
'use server';

/**
 * @fileOverview A flow to generate a random duel idea.
 * - generateDuelIdea - A function that returns a duel idea.
 */
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { GenerateDuelIdeaInput, DuelIdeaOutput } from '@/lib/types';
import { GenerateDuelIdeaInputSchema, DuelIdeaOutputSchema } from '@/lib/types';

const generateDuelIdeaFlow = ai.defineFlow(
  {
    name: 'generateDuelIdeaFlow',
    inputSchema: GenerateDuelIdeaInputSchema,
    outputSchema: DuelIdeaOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: googleAI.model('gemini-pro'),
      output: { schema: DuelIdeaOutputSchema },
      prompt: `You are a creative assistant specialized in creating engaging "A vs B" style duel topics for a social voting app called DuelDash.

        Generate a compelling and fun duel topic that people would have strong opinions about.
        The topic can be about anything: movies, food, technology, hypothetical scenarios, pop culture, etc.

        Provide a concise title for the duel (formatted as a question), a short engaging description to give context, and the two opposing options.

        Make the titles and description in Spanish.

        Example:
        Title: ¿Qué superpoder preferirías tener?
        Description: Si pudieras elegir un solo poder, ¿cuál sería el más útil o divertido en tu día a día?
        Option 1: Volar
        Option 2: Invisibilidad

        Return the output in the specified JSON format.
        `,
    }, { apiKey: input.apiKey });

    if (!output) {
      throw new Error('Could not generate a duel idea.');
    }
    return output;
  }
);

export async function generateDuelIdea(input: GenerateDuelIdeaInput): Promise<DuelIdeaOutput> {
  return generateDuelIdeaFlow(input);
}
