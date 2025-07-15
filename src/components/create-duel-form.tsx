
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';

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
import { Terminal, Upload } from 'lucide-react';
import type { Duel } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { FormState } from '@/lib/actions';

interface SubmitButtonProps {
  isEditing?: boolean;
  isPending: boolean;
}

function SubmitButton({ isEditing = false, isPending }: SubmitButtonProps) {
  const buttonText = isEditing ? 'Guardar Cambios' : 'Crear Duelo';
  const pendingText = isEditing ? 'Guardando...' : 'Creando Duelo...';

  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending ? pendingText : buttonText}
    </Button>
  );
}

interface CreateDuelFormProps {
  state: FormState;
  formAction: (payload: FormData) => void;
  duelData?: Duel;
  isEditing?: boolean;
  isPending: boolean;
}

export default function CreateDuelForm({ state, formAction, duelData, isEditing = false, isPending }: CreateDuelFormProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const form = useForm<CreateDuelFormValues>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: duelData ? {
      title: duelData.title,
      description: duelData.description,
      type: duelData.type,
      options: duelData.options.map(opt => ({ title: opt.title, imageUrl: opt.imageUrl })),
    } : {
      title: '',
      description: '',
      type: 'A_VS_B',
      options: [
        { title: '', imageUrl: '' },
        { title: '', imageUrl: '' },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: "Por favor, selecciona una imagen de menos de 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(`options.${index}.imageUrl`, reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: CreateDuelFormValues) => {
    const formData = new FormData();
    if (isEditing && duelData?.id) {
        formData.append('id', duelData.id);
    }
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('type', data.type);
    data.options.forEach((option, index) => {
        formData.append(`options.${index}.title`, option.title);
        formData.append(`options.${index}.imageUrl`, option.imageUrl);
        // Include original IDs for editing context
        if (isEditing && duelData?.options[index]?.id) {
          formData.append(`options.${index}.id`, duelData.options[index].id);
        }
    });
    formAction(formData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
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
              <FormDescription>
                {isEditing ? "El tipo de duelo no se puede cambiar una vez creado." : "Actualmente, solo el formato A vs B está disponible."}
              </FormDescription>
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
                                    <FormLabel>URL de la Imagen o Subir Archivo</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="https://... o sube un archivo" {...field} />
                                        </FormControl>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => fileInputRefs.current[index]?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" /> Subir
                                        </Button>
                                    </div>
                                    <input 
                                        type="file"
                                        ref={el => fileInputRefs.current[index] = el}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        onChange={(e) => handleFileChange(e, index)}
                                    />
                                    <FormDescription>Pega una URL o sube una imagen (máx 2MB).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {form.watch(`options.${index}.imageUrl`) && (
                            <div className="relative w-full h-48 mt-2 rounded-md overflow-hidden border">
                                <img src={form.watch(`options.${index}.imageUrl`)} alt="Vista previa" className="w-full h-full object-cover" />
                            </div>
                        )}
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

        {state.errors?._form && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{state.errors._form.join(', ')}</AlertDescription>
            </Alert>
        )}

        <SubmitButton isEditing={isEditing} isPending={isPending} />
      </form>
    </Form>
  );
}
