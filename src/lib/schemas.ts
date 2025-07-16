
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
  id: z.string().optional(),
  title: z.string().min(1, { message: "El título de la opción es requerido." }).max(50),
  imageUrl: imageUrlSchema.optional(),
  affiliateUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
});

export const createDuelSchema = z.object({
  type: z.enum(['A_VS_B', 'LIST']),
  title: z.string().min(3, { message: "El título debe tener al menos 3 caracteres." }).max(100),
  description: z.string().max(500).optional(),
  options: z.array(duelOptionSchema).min(1, "Debe haber al menos una opción."),
  startsAt: z.coerce.date({
      required_error: 'Por favor, selecciona una fecha de inicio.',
      invalid_type_error: "Por favor, selecciona una fecha de inicio válida."
  }),
  endsAt: z.coerce.date({
      required_error: 'Por favor, selecciona una fecha de fin.',
      invalid_type_error: "Por favor, selecciona una fecha de fin válida."
  }),
  userKeys: z.coerce.number().optional(), // Make this optional for updates
}).superRefine((data, ctx) => {
    if (data.endsAt <= data.startsAt) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de fin debe ser posterior a la fecha de inicio.",
            path: ["endsAt"],
        });
    }
    if (data.type === 'A_VS_B' && data.options.length !== 2) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Los duelos 'A vs B' deben tener exactamente 2 opciones.",
            path: ["options"],
        });
    }
    if (data.type === 'LIST' && (data.options.length < 2 || data.options.length > 5)) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Los duelos de tipo 'Lista' deben tener entre 2 y 5 opciones.",
            path: ["options"],
        });
    }
});


export type CreateDuelFormValues = z.infer<typeof createDuelSchema>;
