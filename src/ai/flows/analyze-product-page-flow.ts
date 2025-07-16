
'use server';

/**
 * @fileOverview An AI flow to analyze the HTML of a product page when standard scraping fails.
 *
 * - analyzeProductPage - A function that takes HTML content and extracts product info.
 */
import { googleAI } from '@genkit-ai/googleai';
import { ai } from '@/ai/genkit';
import type { AnalyzeProductPageInput, AnalyzeProductPageOutput } from '@/lib/types';
import { AnalyzeProductPageInputSchema, AnalyzeProductPageOutputSchema } from '@/lib/types';

const analyzePromptText = `You are an expert web scraper. You are given the HTML content of a product page.
Your task is to extract the main product title and the primary product image URL.

- The title should be the concise name of the product, without extra marketing text.
- The image URL must be a full, absolute URL. If you find a relative URL, convert it to an absolute one using the provided page URL: {{{url}}}.
- Prioritize high-resolution images if available. Look for attributes like 'data-src', 'src', or inside 'script' tags with JSON data.

Analyze the following HTML content:
\`\`\`html
{{{htmlContent}}}
\`\`\`
`;

const analyzeProductPageFlow = ai.defineFlow(
    {
        name: 'analyzeProductPageFlow',
        inputSchema: AnalyzeProductPageInputSchema,
        outputSchema: AnalyzeProductPageOutputSchema,
    },
    async (input) => {
        const { output } = await ai.generate({
            model: googleAI.model('gemini-pro'),
            prompt: analyzePromptText,
            input,
            output: {
                schema: AnalyzeProductPageOutputSchema,
            },
        });
        
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
        throw new Error(`Error de IA: ${originalMessage}. Asegúrate de que la clave GEMINI_API_KEY está configurada en tu entorno.`);
    }
}
