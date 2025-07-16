'use server';
/**
 * @fileOverview A flow to scrape product information from a URL.
 * - scrapeUrl - A function that takes a URL and returns the product title and image URL.
 * - ScrapeUrlInput - The input type for the scrapeUrl function.
 * - ScrapeUrlOutput - The return type for the scrapeUrl function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ScrapeUrlInputSchema, ScrapeUrlOutputSchema } from '@/lib/types';

export type ScrapeUrlInput = z.infer<typeof ScrapeUrlInputSchema>;
export type ScrapeUrlOutput = z.infer<typeof ScrapeUrlOutputSchema>;

export async function scrapeUrl(input: ScrapeUrlInput): Promise<ScrapeUrlOutput> {
  return scrapeUrlFlow(input);
}

const scrapeUrlFlow = ai.defineFlow(
  {
    name: 'scrapeUrlFlow',
    inputSchema: ScrapeUrlInputSchema,
    outputSchema: ScrapeUrlOutputSchema,
  },
  async ({ url }) => {
    try {
      // Fetch the HTML content of the URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      const htmlContent = await response.text();

      // Use an LLM to parse the HTML and extract the data
      const llmResponse = await ai.generate({
        prompt: `
          You are an expert web scraper. Analyze the following HTML content and extract the main product title and the primary product image URL.
          The image URL should be a direct link to an image file (e.g., .jpg, .png, .webp).

          HTML Content:
          \`\`\`html
          ${htmlContent.substring(0, 20000)}
          \`\`\`
        `,
        output: {
          schema: ScrapeUrlOutputSchema,
        },
        config: {
          // Add a temperature to allow for some flexibility in parsing different HTML structures
          temperature: 0.3,
        }
      });

      const output = llmResponse.output;

      if (!output || !output.title || !output.imageUrl) {
        throw new Error('AI failed to extract complete data from the URL.');
      }
      
      return output;

    } catch (error) {
      console.error('Error in scrapeUrlFlow:', error);
      // Return a structured error that the client can handle
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during scraping.';
      throw new Error(errorMessage);
    }
  }
);
