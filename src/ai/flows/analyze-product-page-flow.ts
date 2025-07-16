
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
        
        const { output } = await analyzePrompt(input);
        if (!output) {
            throw new Error('La IA no pudo analizar la página del producto.');
        }
        return output;
    }
);


export async function analyzeProductPage(input: AnalyzeProductPageInput): Promise<AnalyzeProductPageOutput> {
    return analyzeProductPageFlow(input);
}
