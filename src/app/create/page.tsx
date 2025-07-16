
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateDuelForm from "@/components/create-duel-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { createDuelAction, type FormState } from '@/lib/actions';
import { useActionState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Key, Info, Sparkles, Loader } from 'lucide-react';
import { generateDuelIdea } from '@/ai/flows/generate-duel-idea-flow';
import type { CreateDuelFormValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';

const DUEL_CREATION_COST = 5;

const initialState: FormState = {
  message: '',
  success: false,
  errors: {},
};

export default function CreateDuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addDuel, user, apiKey } = useAppContext();
  const [state, formAction, isPending] = useActionState(createDuelAction, initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<Partial<CreateDuelFormValues> | null>(null);

  useEffect(() => {
    if (state.success && state.newDuel) {
      addDuel(state.newDuel);
      toast({
        title: state.newDuel.status === 'draft' ? '¡Borrador Guardado!' : '¡Éxito!',
        description: state.message,
      });
      router.push('/panel/mis-duelos');
    } else if (state.message && !state.success) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, router, addDuel, user.keys]);

  const handleGenerate = async () => {
    console.log("Attempting to generate with API Key:", apiKey ? `...${apiKey.slice(-4)}` : 'Not found');
    if (!apiKey) {
       toast({
        variant: 'destructive',
        title: 'Falta la Clave de API',
        description: 'Por favor, introduce una clave de API de Gemini en el panel de Ajustes de IA del administrador.',
        duration: 8000
      });
      return;
    }
    setIsGenerating(true);
    try {
      const idea = await generateDuelIdea(apiKey);
      setGeneratedData({
        title: idea.title,
        description: idea.description,
        options: [
          { title: idea.option1, imageUrl: '' },
          { title: idea.option2, imageUrl: '' },
        ]
      });
    } catch (error) {
      console.error("Error generating duel idea:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: `No se pudo generar la idea. Detalle: ${errorMessage}`,
        duration: 8000
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {user.keys < DUEL_CREATION_COST && (
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200 text-blue-800">
              <Info className="h-4 w-4 !text-blue-800" />
              <AlertTitle>No tienes suficientes llaves</AlertTitle>
              <AlertDescription>
                  Puedes rellenar y guardar el duelo como un borrador. Cuando tengas suficientes llaves ({DUEL_CREATION_COST}), podrás activarlo desde el panel "Mis Duelos".
              </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start gap-4">
              <div>
                 <CardTitle className="text-3xl font-headline">Crear un Nuevo Duelo</CardTitle>
                <CardDescription className='mt-2 flex items-center gap-2'>
                  Rellena el formulario para lanzar tu duelo. 
                  <span className='font-bold flex items-center gap-1'>
                    Coste de activación: 5 <Key className="h-4 w-4 text-yellow-500" />
                  </span>
                </CardDescription>
              </div>
               {user.role === 'admin' && (
                  <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                        <Loader className="animate-spin" />
                    ) : (
                        <Sparkles className="text-accent" />
                    )}
                    Generar con IA
                  </Button>
               )}
            </div>
          </CardHeader>
          <CardContent>
            <CreateDuelForm 
              user={user} 
              state={state} 
              formAction={formAction} 
              isPending={isPending}
              key={generatedData ? JSON.stringify(generatedData) : 'form'}
              duelDataFromAI={generatedData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
