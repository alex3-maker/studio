
import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is the global/default Genkit instance.
// It is used for flows/prompts that do not require dynamic configuration.
// For flows that need dynamic configuration (like passing an API key),
// a new, temporary Genkit instance will be created within the flow itself.
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: 'googleai/gemini-2.0-flash',
});
