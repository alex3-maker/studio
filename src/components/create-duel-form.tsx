
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect, useState } from 'react';
import { format } from "date-fns";
import { es } from 'date-fns/locale';

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
import { Terminal, Upload, CalendarIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import type { Duel, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { FormState } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { scrapeUrl } from '@/ai/flows/scrape-url-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


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
  user?: User; 
  state: FormState;
  formAction: (payload: FormData) => void;
  duelData?: Duel;
  isEditing?: boolean;
  isPending: boolean;
  duelDataFromAI?: Partial<CreateDuelFormValues> | null;
}

export default function CreateDuelForm({ user, state, formAction, duelData, isEditing = false, isPending, duelDataFromAI }: CreateDuelFormProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [productUrls, setProductUrls] = useState<string[]>(['', '']);
  const [isScraping, setIsScraping] = useState<boolean[]>([false, false]);
  
  const defaultValues = duelData ? {
      title: duelData.title,
      description: duelData.description,
      type: duelData.type,
      options: duelData.options.map(opt => ({ title: opt.title, imageUrl: opt.imageUrl || '' })),
      startsAt: new Date(duelData.startsAt),
      endsAt: new Date(duelData.endsAt),
  } : {
      title: '',
      description: '',
      type: 'A_VS_B',
      options: [
        { title: '', imageUrl: '' },
        { title: '', imageUrl: '' },
      ],
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };

  const form = useForm<CreateDuelFormValues>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: duelDataFromAI ? { ...defaultValues, ...duelDataFromAI } : defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  useEffect(() => {
    if (duelDataFromAI) {
      form.reset({
        ...defaultValues,
        ...duelDataFromAI,
        startsAt: defaultValues.startsAt,
        endsAt: defaultValues.endsAt,
        type: defaultValues.type,
      });
    }
  }, [duelDataFromAI, form, defaultValues]);

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

  const handleImportFromUrl = async (index: number) => {
    const url = productUrls[index];
    if (!url || !url.startsWith('http')) {
        toast({ variant: "destructive", title: "URL Inválida", description: "Por favor, introduce una URL válida." });
        return;
    }

    setIsScraping(prev => {
        const newScraping = [...prev];
        newScraping[index] = true;
        return newScraping;
    });

    try {
        const result = await scrapeUrl({ url });
        form.setValue(`options.${index}.title`, result.title, { shouldValidate: true });
        form.setValue(`options.${index}.imageUrl`, result.imageUrl, { shouldValidate: true });
        toast({ title: "¡Éxito!", description: "Producto importado correctamente." });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({ variant: "destructive", title: "Error al Importar", description: `No se pudo obtener la información. Detalle: ${errorMessage}` });
    } finally {
        setIsScraping(prev => {
            const newScraping = [...prev];
            newScraping[index] = false;
            return newScraping;
        });
    }
  };

  const onSubmit = (data: CreateDuelFormValues) => {
    const formData = new FormData();
    if (isEditing && duelData?.id) {
        formData.append('id', duelData.id);
    } else if (user) {
        formData.append('userKeys', user.keys.toString());
    }

    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('type', data.type);
    formData.append('startsAt', data.startsAt.toISOString());
    formData.append('endsAt', data.endsAt.toISOString());

    data.options.forEach((option, index) => {
        formData.append(`options.${index}.title`, option.title);
        formData.append(`options.${index}.imageUrl`, option.imageUrl || '');
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Cuándo empezará a ser visible el duelo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Elige una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < (form.getValues("startsAt") || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                   Cuándo se cerrará el duelo a nuevas votaciones.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    <CardContent>
                      <Tabs defaultValue="manual" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="manual">Manual</TabsTrigger>
                          <TabsTrigger value="url">Importar desde URL</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="space-y-4 mt-4">
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
                                        <FormLabel>URL de la Imagen (Opcional)</FormLabel>
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
                                        <FormDescription>Pega una URL o sube una imagen (máx 2MB). Déjalo en blanco para una opción de solo texto.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </TabsContent>
                        <TabsContent value="url" className="space-y-4 mt-4">
                          <div className='space-y-2'>
                            <FormLabel htmlFor={`product-url-${index}`}>URL del Producto</FormLabel>
                            <div className="flex gap-2">
                                <Input 
                                    id={`product-url-${index}`}
                                    placeholder="Pega la URL de un producto aquí (ej: Amazon)" 
                                    value={productUrls[index]}
                                    onChange={(e) => {
                                        const newUrls = [...productUrls];
                                        newUrls[index] = e.target.value;
                                        setProductUrls(newUrls);
                                    }}
                                    disabled={isScraping[index]}
                                />
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => handleImportFromUrl(index)}
                                    disabled={isScraping[index] || !productUrls[index]}
                                >
                                    {isScraping[index] ? <Loader2 className="animate-spin" /> : <LinkIcon className="mr-2" />}
                                    Importar
                                </Button>
                            </div>
                            <FormDescription>El sistema extraerá el título y la imagen del producto. Aún podrás editarlos después.</FormDescription>
                          </div>
                        </TabsContent>
                      </Tabs>
                      {form.watch(`options.${index}.imageUrl`) && (
                          <div className="relative w-full h-48 mt-4 rounded-md overflow-hidden border bg-muted/30">
                              <img src={form.watch(`options.${index}.imageUrl`) as string} alt="Vista previa" className="w-full h-full object-contain" />
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

        {state.errors?._form && !state.success && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error al Procesar el Formulario</AlertTitle>
                <AlertDescription>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
                        {state.errors._form.join('\n')}
                    </pre>
                </AlertDescription>
            </Alert>
        )}

        <SubmitButton isEditing={isEditing} isPending={isPending} />
      </form>
    </Form>
  );
}
