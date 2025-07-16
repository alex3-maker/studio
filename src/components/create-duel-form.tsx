
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect, useState } from 'react';
import { format, formatISO } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, Upload, CalendarIcon, Link as LinkIcon, Loader2, PlusCircle, X } from 'lucide-react';
import type { Duel, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { FormState } from '@/lib/actions';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { scrapeUrl } from '@/ai/flows/scrape-url-flow';
import { analyzeProductPage } from '@/ai/flows/analyze-product-page-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppContext } from '@/context/app-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


interface SubmitButtonProps {
  isEditing?: boolean;
  isPending: boolean;
}

function SubmitButton({ isEditing = false, isPending }: SubmitButtonProps) {
  const buttonText = isEditing ? 'Guardar Cambios' : 'Crear Duelo';
  const pendingText = isEditing ? 'Guardando...' : 'Creando Duelo...';

  return (
    <Button type="submit" disabled={isPending} className="w-full mt-8">
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        buttonText
      )}
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

function ManualInputFields({ form, index, handleFileChange, fileInputRefs }: any) {
    const { fields } = useFieldArray({
        control: form.control,
        name: "options"
    });

    return (
        <div className="space-y-4 mt-4">
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
                            ref={el => {
                                if (el) {
                                    fileInputRefs.current[index] = el;
                                }
                            }}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, index)}
                        />
                        <FormDescription>Pega una URL o sube una imagen (máx 2MB). Déjalo en blanco para una opción de solo texto.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name={`options[${index}].affiliateUrl`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>URL (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://ejemplo.com/enlace" {...field} />
                        </FormControl>
                        <FormDescription>Si quieres, añade un enlace externo para esta opción.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}

const MAX_TITLE_LENGTH = 100;
const MAX_DESC_LENGTH = 500;

export default function CreateDuelForm({ user, state, formAction, duelData, isEditing = false, isPending, duelDataFromAI }: CreateDuelFormProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [productUrls, setProductUrls] = useState<string[]>(['', '']);
  const [isScraping, setIsScraping] = useState<boolean[]>([false, false]);
  const { apiKey, isAiEnabled, addDuel } = useAppContext();
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const defaultValues = duelData ? {
      type: duelData.type || 'A_VS_B',
      id: duelData.id,
      title: duelData.title,
      description: duelData.description,
      options: duelData.options.map(opt => ({ id: opt.id, title: opt.title, imageUrl: opt.imageUrl || '', affiliateUrl: opt.affiliateUrl || '' })),
      startsAt: new Date(duelData.startsAt),
      endsAt: new Date(duelData.endsAt),
  } : {
      type: 'A_VS_B' as const,
      title: '',
      description: '',
      options: [
        { title: '', imageUrl: '', affiliateUrl: '' },
        { title: '', imageUrl: '', affiliateUrl: '' },
      ],
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  };

  const form = useForm<CreateDuelFormValues>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: duelDataFromAI ? { ...defaultValues, ...duelDataFromAI, type: 'A_VS_B' } : defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });
  
  const duelType = form.watch('type');
  const titleValue = form.watch('title');
  const descriptionValue = form.watch('description');

  useEffect(() => {
    if (duelType === 'A_VS_B' && fields.length > 2) {
      // remove extra fields if type is A_VS_B
      for (let i = fields.length - 1; i > 1; i--) {
        remove(i);
      }
    }
  }, [duelType, fields.length, remove]);


  // Effect to show toast on server-side validation errors
  useEffect(() => {
    if (state.message && !state.success && formSubmitted) {
      toast({
        variant: 'destructive',
        title: 'Error de validación',
        description: state.message,
      });
      setFormSubmitted(false);
    }
  }, [state, toast, formSubmitted]);


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

    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'Falta la Clave de API',
        description: 'No se ha configurado una clave de API de Gemini. Un admin puede añadirla en los Ajustes de IA.',
        duration: 8000,
      });
      return;
    }

    setIsScraping(prev => {
        const newScraping = [...prev];
        newScraping[index] = true;
        return newScraping;
    });

    try {
        const result = await scrapeUrl({ url });

        if (result.title && result.imageUrl) {
            form.setValue(`options.${index}.title`, result.title, { shouldValidate: true });
            form.setValue(`options.${index}.imageUrl`, result.imageUrl, { shouldValidate: true });
            form.setValue(`options.${index}.affiliateUrl`, url, { shouldValidate: true });
            toast({ title: "¡Éxito!", description: "Producto importado directamente." });
        } else {
            toast({ title: "Análisis Profundo", description: "No se encontraron metadatos. Usando IA para analizar la página. Esto puede tardar un momento..." });
            
            const aiResult = await analyzeProductPage({ htmlContent: result.htmlContent, url, apiKey });

            form.setValue(`options.${index}.title`, aiResult.title, { shouldValidate: true });
            form.setValue(`options.${index}.imageUrl`, aiResult.imageUrl, { shouldValidate: true });
            form.setValue(`options.${index}.affiliateUrl`, url, { shouldValidate: true });
            toast({ title: "¡Éxito con IA!", description: "Producto importado usando análisis de IA." });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
            variant: "destructive",
            title: "Error al Importar",
            description: (
                <div className="space-y-2">
                    <p>No se pudo obtener la información.</p>
                    <div className="text-xs bg-destructive-foreground/10 p-2 rounded-md font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                        {errorMessage}
                    </div>
                </div>
            ),
            duration: 15000
        });
    } finally {
        setIsScraping(prev => {
            const newScraping = [...prev];
            newScraping[index] = false;
            return newScraping;
        });
    }
  };
  
  const handleFormSubmit = (data: any) => {
    setFormSubmitted(true);
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'options') {
            data.options.forEach((option: any, index: number) => {
                Object.keys(option).forEach(optionKey => {
                    formData.append(`options[${index}].${optionKey}`, option[optionKey]);
                });
            });
        } else if (data[key] instanceof Date) {
            formData.append(key, formatISO(data[key]));
        } else {
            formData.append(key, data[key]);
        }
    });

    if (isEditing && duelData?.id) {
        formData.append('id', duelData.id);
    }
    if (!isEditing && user) {
        formData.append('userKeys', String(user.keys));
    }
    
    formAction(formData);
  };


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        {isEditing && duelData?.id && <input type="hidden" name="id" value={duelData.id} />}
        {!isEditing && user && <input type="hidden" name="userKeys" value={user.keys} />}
        
        {/* Header Fields */}
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del Duelo</FormLabel>
                           <div className="relative">
                              <FormControl>
                                <Input placeholder="Ej: ¿Mejor película de ciencia ficción?" {...field} maxLength={MAX_TITLE_LENGTH} />
                              </FormControl>
                               <p className="absolute top-2.5 right-3 text-xs text-muted-foreground">
                                  {titleValue.length} / {MAX_TITLE_LENGTH}
                               </p>
                           </div>
                          <FormDescription>
                            Un título atractivo para tu duelo.
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name} disabled={isEditing}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo de duelo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A_VS_B">Duelo A vs B</SelectItem>
                            <SelectItem value="LIST">Lista (Ranking)</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormDescription>Elige el formato. No se puede cambiar después.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
                 <div className="w-full md:w-2/3 flex">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="flex flex-col flex-grow">
                          <FormLabel>Descripción (Opcional)</FormLabel>
                          <div className="relative flex-grow">
                              <FormControl>
                                <Textarea placeholder="Añade una breve descripción para dar contexto." {...field} maxLength={MAX_DESC_LENGTH} className="resize-none h-full" />
                              </FormControl>
                              <p className="absolute top-2.5 right-3 text-xs text-muted-foreground">
                                    {(descriptionValue || '').length} / {MAX_DESC_LENGTH}
                              </p>
                          </div>
                          <FormMessage className='pt-2'/>
                        </FormItem>
                      )}
                    />
                 </div>

                <div className="w-full md:w-1/3 space-y-6">
                   <FormField
                    control={form.control}
                    name="startsAt"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <input type="hidden" name="startsAt" value={field.value ? formatISO(field.value) : ''} />
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Elige una fecha</span>
                                )}
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
                        <input type="hidden" name="endsAt" value={field.value ? formatISO(field.value) : ''} />
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                 <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
                                ) : (
                                  <span>Elige una fecha</span>
                                )}
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
            </div>
        </div>

        <Separator />
        
        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => (
                <Card key={field.id} className="relative flex flex-col">
                    <CardHeader>
                        <CardTitle>Opción {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-grow">
                       <input type="hidden" {...form.register(`options[${index}].id`)} />
                        <FormField
                            control={form.control}
                            name={`options[${index}].title`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título de la Opción</FormLabel>
                                    <FormControl><Input placeholder={`Título para la opción ${index + 1}`} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {form.watch(`options.${index}.imageUrl`) && (
                            <div className="relative w-full h-48 mt-4 rounded-md overflow-hidden border bg-muted/30">
                                <img src={form.watch(`options.${index}.imageUrl`) as string} alt="Vista previa" className="w-full h-full object-contain" />
                            </div>
                        )}
                        
                        {isAiEnabled && duelType === 'A_VS_B' && index < 2 ? (
                            <Tabs defaultValue="manual" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
                                    <TabsTrigger value="url">Importar desde URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="manual">
                                    <ManualInputFields form={form} index={index} handleFileChange={handleFileChange} fileInputRefs={fileInputRefs} />
                                </TabsContent>
                                <TabsContent value="url" className="space-y-4 mt-4">
                                    <div className='space-y-2'>
                                      <FormLabel htmlFor={`product-url-${index}`}>URL del Producto</FormLabel>
                                      <div className="flex gap-2">
                                          <Input 
                                              id={`product-url-${index}`}
                                              placeholder="Pega la URL de un producto (ej: Amazon)" 
                                              value={productUrls[index] || ''}
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
                                      <FormDescription>El sistema intentará extraer el título y la imagen. Si falla, usará IA como respaldo (requiere clave de API).</FormDescription>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : (
                             <ManualInputFields form={form} index={index} handleFileChange={handleFileChange} fileInputRefs={fileInputRefs} />
                        )}
                    </CardContent>
                     {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                </Card>
            ))}
        </div>

        {duelType === 'LIST' && fields.length < 5 && (
            <div className="md:col-span-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => append({ title: '', imageUrl: '', affiliateUrl: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Opción
                </Button>
            </div>
        )}
        <FormMessage>{form.formState.errors.options?.root?.message}</FormMessage>
        
        {state.errors?.moderation && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error de Moderación de Contenido</AlertTitle>
                <AlertDescription>{state.errors.moderation}</AlertDescription>
            </Alert>
        )}

        {state.errors?._form && !state.success && formSubmitted && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error al Procesar el Formulario</AlertTitle>
                <AlertDescription className="text-sm font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto text-destructive bg-destructive/10 p-2 rounded">
                    {state.errors._form.join('\n')}
                </AlertDescription>
            </Alert>
        )}

        <SubmitButton isEditing={isEditing} isPending={isPending} />
      </form>
    </Form>
  );
}

