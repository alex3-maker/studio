
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { config } from 'dotenv';

config();

// This is the global/default Genkit instance.
// It is configured to use the GEMINI_API_KEY from the environment variables.
// Next.js automatically loads .env files on the server, making the key available here.
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-pro',
});
