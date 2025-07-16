
'use server';
/**
 * @fileOverview A flow to scrape product information from a URL.
 * - scrapeUrl - A function that takes a URL and returns the product title, image URL, and raw HTML content.
 * - ScrapeUrlInput - The input type for the scrapeUrl function.
 * - ScrapeUrlOutput - The return type for the scrapeUrl function.
 */

import { z } from 'zod';

export const ScrapeUrlInputSchema = z.object({
  url: z.string().url({ message: 'Por favor, introduce una URL válida.' }),
});
export type ScrapeUrlInput = z.infer<typeof ScrapeUrlInputSchema>;

export const ScrapeUrlOutputSchema = z.object({
  title: z.string().nullable().describe('The extracted product title.'),
  imageUrl: z.string().url().nullable().describe('The URL of the main product image.'),
  htmlContent: z.string().describe('The full HTML content of the page.'),
});
export type ScrapeUrlOutput = z.infer<typeof ScrapeUrlOutputSchema>;


// Helper function to parse meta tags from HTML
const parseMetaTags = (html: string): { title: string | null; imageUrl: string | null } => {
  const titleRegex = /<meta\s+(?:property="og:title"|name="twitter:title")\s+content="([^"]*)"|<title>([^<]*)<\/title>/i;
  const imageRegex = /<meta\s+(?:property="og:image"|name="twitter:image")\s+content="([^"]*)"/i;

  const titleMatch = html.match(titleRegex);
  const imageMatch = html.match(imageRegex);

  // og:title or twitter:title has priority, fallback to <title> tag
  const title = titleMatch ? titleMatch[1] || titleMatch[2] : null;
  const imageUrl = imageMatch ? imageMatch[1] : null;

  return { title: title?.trim() || null, imageUrl };
};

export async function scrapeUrl(input: ScrapeUrlInput): Promise<ScrapeUrlOutput> {
  const validatedInput = ScrapeUrlInputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error('URL no válida.');
  }
  const { url } = validatedInput.data;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
        throw new Error(`No se pudo acceder a la URL. Estado: ${response.status}`);
    }
    const htmlContent = await response.text();

    const { title, imageUrl } = parseMetaTags(htmlContent);

    let validatedImageUrl = null;
    if (imageUrl) {
        const validation = z.string().url().safeParse(imageUrl);
        if (validation.success) {
            validatedImageUrl = validation.data;
        }
    }

    return { title, imageUrl: validatedImageUrl, htmlContent };

  } catch (error) {
    console.error('Error en scrapeUrl:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido durante la extracción de datos.';
    throw new Error(errorMessage);
  }
}
