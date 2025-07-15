
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateDuelForm from "@/components/create-duel-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { createDuelAction, type FormState } from '@/lib/actions';
import { useActionState } from 'react';
import { useAppContext } from '@/context/app-context';

const initialState: FormState = {
  message: '',
  success: false,
  errors: {},
};

export default function CreateDuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addDuel } = useAppContext();
  const [state, formAction, isPending] = useActionState(createDuelAction, initialState);

  useEffect(() => {
    if (state.success && state.newDuel) {
      addDuel(state.newDuel);
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      router.push('/panel/mis-duelos');
    } else if (state.message && !state.success && (state.errors?.moderation || state.errors?._form)) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, router, addDuel]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Crear un Nuevo Duelo</CardTitle>
            <CardDescription>
              Rellena el formulario para lanzar tu duelo. Tu contenido será revisado automáticamente.
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
