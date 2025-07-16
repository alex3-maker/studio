
'use server';
/**
 * @fileOverview A flow to scrape product information from a URL.
 * - scrapeUrl - A function that takes a URL and returns the product title and image URL by parsing Open Graph meta tags.
 * - ScrapeUrlInput - The input type for the scrapeUrl function.
 * - ScrapeUrlOutput - The return type for the scrapeUrl function.
 */

import { z } from 'zod';
import { ScrapeUrlInputSchema, ScrapeUrlOutputSchema } from '@/lib/types';

export type ScrapeUrlInput = z.infer<typeof ScrapeUrlInputSchema>;
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
    // Fetch the HTML content of the URL
    // We add a common user-agent header to mimic a browser and avoid being blocked.
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

    if (!title || !imageUrl) {
      let missing = [];
      if (!title) missing.push('título');
      if (!imageUrl) missing.push('imagen');
      throw new Error(`No se pudo encontrar la información requerida (${missing.join(' y ')}). La página podría no tener metadatos de Open Graph.`);
    }

    // Validate the extracted image URL before returning
    const validatedImageUrl = z.string().url().safeParse(imageUrl);
    if (!validatedImageUrl.success) {
        throw new Error(`La URL de la imagen extraída no es válida: ${imageUrl}`);
    }
    
    return { title, imageUrl };

  } catch (error) {
    console.error('Error en scrapeUrl:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido durante la extracción de datos.';
    throw new Error(errorMessage);
  }
}
