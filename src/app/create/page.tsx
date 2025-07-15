
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateDuelForm from "@/components/create-duel-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { createDuelAction, type FormState } from '@/lib/actions';
import { useActionState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Key, Info } from 'lucide-react';

const DUEL_CREATION_COST = 5;

const initialState: FormState = {
  message: '',
  success: false,
  errors: {},
};

export default function CreateDuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addDuel, user } = useAppContext();
  const [state, formAction, isPending] = useActionState(createDuelAction, initialState);

  useEffect(() => {
    if (state.success && state.newDuel) {
      addDuel(state.newDuel, user.keys); // Pass current keys for logic
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
            <CardTitle className="text-3xl font-headline">Crear un Nuevo Duelo</CardTitle>
            <CardDescription className='flex items-center gap-2'>
              Rellena el formulario para lanzar tu duelo. 
              <span className='font-bold flex items-center gap-1'>
                Coste de activación: 5 <Key className="h-4 w-4 text-yellow-500" />
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDuelForm state={state} formAction={formAction} isPending={isPending} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
