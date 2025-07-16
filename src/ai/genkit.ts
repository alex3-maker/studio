
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';

// Explicitly load environment variables from a .env file.
dotenv.config();

// This is the global/default Genkit instance.
// It is configured to use the GEMINI_API_KEY from the environment variables.
// We are explicitly loading .env to ensure the key is available here.
export const ai = genkit({
  plugins: [googleAI()],
});
