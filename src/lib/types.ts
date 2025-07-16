
import { z } from "zod";

export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  keys: number;
  duelsCreated: number;
  votesCast: number;
  role: 'admin' | 'user';
  createdAt?: string; // ISO 8601 string
};

export type DuelOption = {
  id: string;
  title: string;
  imageUrl?: string;
  affiliateUrl?: string;
  votes: number;
  "data-ai-hint"?: string;
};

export type Duel = {
  id: string;
  title: string;
  description: string;
  options: DuelOption[];
  creator: Pick<User, 'name' | 'avatarUrl' | 'id'>;
  type: 'A_VS_B' | 'LIST' | 'KING_OF_THE_HILL';
  status: 'active' | 'closed' | 'scheduled' | 'draft' | 'inactive';
  createdAt: string; // ISO 8601 string
  startsAt: string; // ISO 8601 string
  endsAt: string; // ISO 8601 string
};

export type UserVote = {
  optionId: string;
  timestamp: string; // ISO 8601 string
};

export type Notification = {
    id: string;
    type: 'duel-closed' | 'duel-edited' | 'duel-reset' | 'winner-changed' | 'keys-spent';
    message: string;
    link: string | null;
    timestamp: string; // ISO 8601 string
    read: boolean;
};

export type KeyTransaction = {
    id: string;
    type: 'earned' | 'spent';
    amount: number;
    description: string;
    timestamp: string; // ISO 8601 string
}

// Schema for the scraping server action
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


// Schema for the AI analysis flow
export const AnalyzeProductPageInputSchema = z.object({
  htmlContent: z.string().describe('The full HTML content of the product page.'),
  url: z.string().url().describe('The original URL of the product page for context.'),
  apiKey: z.string().optional(),
});
export type AnalyzeProductPageInput = z.infer<typeof AnalyzeProductPageInputSchema>;

export const AnalyzeProductPageOutputSchema = z.object({
  title: z.string().describe('The main, concise title of the product.'),
  imageUrl: z.string().url().describe('The absolute URL of the main product image.'),
});
export type AnalyzeProductPageOutput = z.infer<typeof AnalyzeProductPageOutputSchema>;


// Schema for the Duel Idea Generation flow
export const GenerateDuelIdeaInputSchema = z.object({
  apiKey: z.string().optional(),
});
export type GenerateDuelIdeaInput = z.infer<typeof GenerateDuelIdeaInputSchema>;

export const DuelIdeaOutputSchema = z.object({
  title: z.string().describe('The title of the duel. Should be a question.'),
  description: z.string().describe('A short, engaging description for the duel to provide context.'),
  option1: z.string().describe('The title for the first option (e.g., Team A).'),
  option2: z.string().describe('The title for the second option (e.g., Team B).'),
});
export type DuelIdeaOutput = z.infer<typeof DuelIdeaOutputSchema>;

// Schema for the Content Moderation flow
export const ModerateContentInputSchema = z.object({
  content: z
    .string()
    .describe('The content to be moderated, such as text or an image data URI.'),
  contentType: z
    .enum(['text', 'image'])
    .describe('The type of content being moderated.'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

export const ModerateContentOutputSchema = z.object({
  isSafe: z
    .boolean()
    .describe('Whether the content is safe and does not violate any policies.'),
  reasons: z
    .array(z.string())
    .describe('Reasons why the content was flagged as unsafe, if any.'),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;
