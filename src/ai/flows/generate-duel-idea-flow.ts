
'use server';

/**
 * @fileOverview A flow to generate a random duel idea.
 * - generateDuelIdea - A function that returns a duel idea.
 * - DuelIdeaOutput - The return type for the generateDuelIdea function.
 */
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';

const DuelIdeaInputSchema = z.object({
  apiKey: z.string().optional(),
});

const DuelIdeaOutputSchema = z.object({
  title: z.string().describe('The title of the duel. Should be a question.'),
  description: z.string().describe('A short, engaging description for the duel to provide context.'),
  option1: z.string().describe('The title for the first option (e.g., Team A).'),
  option2: z.string().describe('The title for the second option (e.g., Team B).'),
});
export type DuelIdeaOutput = z.infer<typeof DuelIdeaOutputSchema>;


const generateDuelIdeaPrompt = ai.definePrompt({
    name: 'generateDuelIdeaPrompt',
    input: { schema: z.object({}) },
    output: { schema: DuelIdeaOutputSchema },
    prompt: `You are a creative assistant specialized in creating engaging "A vs B" style duel topics for a social voting app called DueliaX.

    Generate a compelling and fun duel topic that people would have strong opinions about.
    The topic can be about anything: movies, food, technology, hypothetical scenarios, pop culture, etc.

    Provide a concise title for the duel (formatted as a question), a short engaging description to give context, and the titles for the two opposing options.

    Make the titles and description in Spanish.

    Example:
    Title: ¿Qué superpoder preferirías tener?
    Description: Si pudieras elegir un solo poder, ¿cuál sería el más útil o divertido en tu día a día?
    Option 1: Volar
    Option 2: Invisibilidad

    Return the output in the specified JSON format.
    `,
});


const generateDuelIdeaFlow = ai.defineFlow(
  {
    name: 'generateDuelIdeaFlow',
    inputSchema: DuelIdeaInputSchema,
    outputSchema: DuelIdeaOutputSchema,
  },
  async ({ apiKey }) => {
    
    // Dynamically configure Genkit for this specific flow execution
    const dynamicAi = genkit({
      plugins: [googleAI({ apiKey: apiKey || process.env.GEMINI_API_KEY })],
    });

    const { output } = await dynamicAi.prompt(generateDuelIdeaPrompt)({});
    return output!;
  }
);


export async function generateDuelIdea(apiKey?: string): Promise<DuelIdeaOutput> {
  return generateDuelIdeaFlow({ apiKey });
}
