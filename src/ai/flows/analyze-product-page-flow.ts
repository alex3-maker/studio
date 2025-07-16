
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


const analyzeProductPageFlow = ai.defineFlow(
    {
        name: 'analyzeProductPageFlow',
        inputSchema: AnalyzeProductPageInputSchema,
        outputSchema: AnalyzeProductPageOutputSchema,
    },
    async (input) => {
        const analyzePromptText = `You are an expert web scraper. You are given the HTML content of a product page.
Your task is to extract the main product title and the primary product image URL.

- The title should be the concise name of the product, without extra marketing text.
- The image URL must be a full, absolute URL. If you find a relative URL, convert it to an absolute one using the provided page URL: ${input.url}.
- Prioritize high-resolution images if available. Look for attributes like 'data-src', 'src', or inside 'script' tags with JSON data.

Analyze the following HTML content:
\`\`\`html
${input.htmlContent}
\`\`\`
`;
        const { output } = await ai.generate({
            model: googleAI.model('gemini-pro'),
            prompt: analyzePromptText,
            output: {
                schema: AnalyzeProductPageOutputSchema,
            },
        }, { apiKey: input.apiKey });
        
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
        const keyInfo = input.apiKey ? `...${input.apiKey.slice(-4)}` : 'no proporcionada';
        const finalMessage = `Error de IA: ${originalMessage}. (Clave usada: ${keyInfo})`;
        throw new Error(finalMessage);
    }
}
