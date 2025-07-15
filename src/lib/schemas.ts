import { z } from "zod";

const imageRegex = /^(https|http):\/\/[^\s/$.?#].[^\s]*\.(jpeg|jpg|png|gif|webp|svg)(?:\?.*)?$/i;
const dataUriRegex = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/;


export const duelOptionSchema = z.object({
  title: z.string().min(1, { message: "El título de la opción es requerido." }).max(50),
  imageUrl: z.string().refine(value => imageRegex.test(value) || dataUriRegex.test(value), {
    message: "Debe ser una URL de imagen válida o un archivo subido.",
  }),
});

export const createDuelSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["A_VS_B", "LIST", "KING_OF_THE_HILL"], {
    required_error: "Necesitas seleccionar un tipo de duelo.",
  }),
  options: z.array(duelOptionSchema).min(2, { message: "Debes tener al menos 2 opciones." }).max(2, { message: "Los duelos A vs B solo pueden tener 2 opciones." }),
});

export type CreateDuelFormValues = z.infer<typeof createDuelSchema>;