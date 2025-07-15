'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormStatus } from 'react-dom';

import { createDuelSchema, type CreateDuelFormValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creando Duelo...' : 'Crear Duelo'}
    </Button>
  );
}

type FormState = {
  message: string;
  success: boolean;
  errors?: {
    title?: string[];
    description?: string[];
    type?: string[];
    options?: (string | undefined)[] | string;
    moderation?: string;
    _form?: string[];
  };
};

interface CreateDuelFormProps {
  state: FormState;
  formAction: (payload: FormData) => void;
}

export default function CreateDuelForm({ state, formAction }: CreateDuelFormProps) {
  const form = useForm<CreateDuelFormValues>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'A_VS_B',
      options: [
        { title: '', imageUrl: 'https://placehold.co/600x600.png' },
        { title: '', imageUrl: 'https://placehold.co/600x600.png' },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título del Duelo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: ¿Mejor película de ciencia ficción?" {...field} />
              </FormControl>
              <FormDescription>Un título atractivo para tu duelo.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Añade una breve descripción para dar contexto." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Duelo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un formato de duelo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A_VS_B">A vs B</SelectItem>
                  <SelectItem value="LIST" disabled>Lista (Próximamente)</SelectItem>
                  <SelectItem value="KING_OF_THE_HILL" disabled>Rey de la Colina (Próximamente)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Actualmente, solo el formato A vs B está disponible.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

        <div className="space-y-4">
            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardHeader>
                        <CardTitle>Opción {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name={`options.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título de la Opción</FormLabel>
                                    <FormControl><Input placeholder={`Título para la opción ${index + 1}`} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`options.${index}.imageUrl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL de la Imagen</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
        
        {state.errors?.moderation && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Moderación de Contenido</AlertTitle>
                <AlertDescription>{state.errors.moderation}</AlertDescription>
            </Alert>
        )}

        <SubmitButton />
      </form>
    </Form>
  );
}
