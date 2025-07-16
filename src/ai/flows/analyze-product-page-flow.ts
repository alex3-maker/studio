'use server';

/**
 * @fileOverview An AI flow to analyze the HTML of a product page when standard scraping fails.
 *
 * - analyzeProductPage - A function that takes HTML content and extracts product info.
 * - AnalyzeProductPageInput - The input type for the analyzeProductPage function.
 * - AnalyzeProductPageOutput - The return type for the analyzeProductPage function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

export const AnalyzeProductPageInputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the product page.'),
  url: z.string().url().describe('The original URL of the product page for context.'),
});
export type AnalyzeProductPageInput = z.infer<typeof AnalyzeProductPageInputSchema>;

export const AnalyzeProductPageOutputSchema = z.object({
  title: z.string().describe('The main, concise title of the product.'),
  imageUrl: z.string().url().describe('The absolute URL of the main product image.'),
});
export type AnalyzeProductPageOutput = z.infer<typeof AnalyzeProductPageOutputSchema>;


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


export async function analyzeProductPage(input: AnalyzeProductPageInput): Promise<AnalyzeProductPageOutput> {
    const { output } = await analyzePrompt(input);
    if (!output) {
        throw new Error('La IA no pudo analizar la página del producto.');
    }
    return output;
}
