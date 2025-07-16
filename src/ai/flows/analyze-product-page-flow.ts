
'use server';

/**
 * @fileOverview An AI flow to analyze the HTML of a product page when standard scraping fails.
 *
 * - analyzeProductPage - A function that takes HTML content and extracts product info.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { AnalyzeProductPageInput, AnalyzeProductPageOutput } from '@/lib/types';
import { AnalyzeProductPageInputSchema, AnalyzeProductPageOutputSchema } from '@/lib/types';

const analyzePrompt = ai.definePrompt({
    name: 'analyzeProductPagePrompt',
    input: { schema: AnalyzeProductPageInputSchema },
    output: { schema: AnalyzeProductPageOutputSchema },
    prompt: `You are an expert web scraper. You are given the HTML content of a product page.
Your task is to extract the main product title and the primary product image URL.

- The title should be the concise name of the product, without extra marketing text.
- The image URL must be a full, absolute URL. If you find a relative URL, convert it to an absolute one using the provided page URL: {{{url}}}.
- Prioritize high-resolution images if available. Look for attributes like 'data-src', 'src', or inside 'script' tags with JSON data.

Analyze the following HTML content:
\`\`\`html
{{{htmlContent}}}
\`\`\`
`,
    config: {
        model: googleAI.model('gemini-1.5-flash'),
    },
});


const analyzeProductPageFlow = ai.defineFlow(
    {
        name: 'analyzeProductPageFlow',
        inputSchema: AnalyzeProductPageInputSchema,
        outputSchema: AnalyzeProductPageOutputSchema,
    },
    async (input) => {
        const { output } = await analyzePrompt(input, { config: { apiKey: input.apiKey } });
        if (!output) {
            throw new Error('La IA no pudo analizar la página del producto.');
        }
        return output;
    }
);


export async function analyzeProductPage(input: AnalyzeProductPageInput): Promise<AnalyzeProductPageOutput> {
    try {
        return await analyzeProductPageFlow(input);
    } catch (error) {
        const originalMessage = error instanceof Error ? error.message : String(error);
        const apiKeyForDebug = input.apiKey ? `...${input.apiKey.slice(-4)}` : 'No proporcionada';
        
        // Throw a new, more descriptive error that will be caught by the frontend
        throw new Error(`Error de IA: ${originalMessage}. (Clave usada: ${apiKeyForDebug})`);
    }
}
