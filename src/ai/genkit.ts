
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// This is the global/default Genkit instance.
// The API key will be provided on a per-request basis for features that use it,
// or it will rely on a globally configured environment variable if available.
export const ai = genkit({
  plugins: [googleAI()],
});
