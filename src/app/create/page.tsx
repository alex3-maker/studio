
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
import { Key, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
      addDuel(state.newDuel);
      toast({
        title: '¡Éxito!',
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
  }, [state, toast, router, addDuel]);

  if (user.keys < DUEL_CREATION_COST) {
    return (
       <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">No tienes suficientes llaves</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <Key className="h-4 w-4" />
                    <AlertTitle>Coste de creación: {DUEL_CREATION_COST} llaves</AlertTitle>
                    <AlertDescription>
                        Necesitas al menos {DUEL_CREATION_COST} llaves para crear un nuevo duelo. Actualmente tienes {user.keys}. ¡Sigue votando para ganar más!
                    </AlertDescription>
                </Alert>
                <Button asChild className="mt-6 w-full">
                    <Link href="/">Volver al inicio para votar</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Crear un Nuevo Duelo</CardTitle>
            <CardDescription className='flex items-center gap-2'>
              Rellena el formulario para lanzar tu duelo. 
              <span className='font-bold flex items-center gap-1'>
                Coste: 5 <Key className="h-4 w-4 text-yellow-500" />
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
