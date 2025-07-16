
import { z } from "zod";

const imageRegex = /^(https|http):\/\/[^\s/$.?#].[^\s]*\.(jpeg|jpg|png|gif|webp|svg)(?:\?.*)?$/i;
const dataUriRegex = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const imageUrlSchema = z.string().refine(value => {
    if (value === '') return true; // Allow empty string
    return imageRegex.test(value) || dataUriRegex.test(value);
}, {
    message: "Debe ser una URL de imagen válida o un archivo subido.",
});

export const duelOptionSchema = z.object({
  title: z.string().min(1, { message: "El título de la opción es requerido." }).max(50),
  imageUrl: imageUrlSchema.optional(),
  affiliateUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
});

export const createDuelSchema = z.object({
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }).max(100),
  description: z.string().max(500).optional(),
  options: z.array(duelOptionSchema)
    .min(2, { message: "Debes tener al menos 2 opciones." })
    .max(8, { message: "Puedes tener un máximo de 8 opciones." }),
  startsAt: z.date({ required_error: "La fecha de inicio es requerida." }),
  endsAt: z.date({ required_error: "La fecha de fin es requerida." }),
  userKeys: z.number().optional(), // Make this optional for updates
}).refine(data => data.endsAt > data.startsAt, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
    path: ["endsAt"],
});


export type CreateDuelFormValues = z.infer<typeof createDuelSchema>;
