import { z } from "zod";

export const duelOptionSchema = z.object({
  title: z.string().min(1, { message: "Option title is required." }).max(50),
  // In a real app, this would be a file or a URL. For now, we'll just validate the URL string.
  imageUrl: z.string().url({ message: "Please enter a valid image URL." }),
});

export const createDuelSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["A_VS_B", "LIST", "KING_OF_THE_HILL"], {
    required_error: "You need to select a duel type.",
  }),
  options: z.array(duelOptionSchema).min(2, { message: "You must have at least 2 options." }).max(2, { message: "A vs B duels can only have 2 options." }), // For now, only A vs B
});

export type CreateDuelFormValues = z.infer<typeof createDuelSchema>;
