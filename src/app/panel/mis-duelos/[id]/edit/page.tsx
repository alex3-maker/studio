
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateDuelAction, type FormState } from '@/lib/actions';
import { useAppContext } from '@/context/app-context';
import CreateDuelForm from '@/components/create-duel-form';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const initialState: FormState = {
  message: '',
  success: false,
  errors: {},
};

export default function EditUserDuelPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { duels, updateDuel, user } = useAppContext();
  const [state, formAction, isPending] = useActionState(updateDuelAction, initialState);

  const duel = duels.find(d => d.id === params.id);

  useEffect(() => {
    if (state.success && state.updatedDuel) {
      updateDuel(state.updatedDuel);
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      router.push('/panel/mis-duelos');
    } else if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: state.message,
      });
    }
  }, [state, toast, router, updateDuel]);

  if (!duel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-8 w-3/4" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-1/2" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Security check: ensure the user owns this duel
  if (duel.creator.id !== user.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" />
            Acceso Denegado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>No tienes permiso para editar este duelo.</p>
          <Button asChild className="mt-4">
            <Link href="/panel/mis-duelos">Volver a mis duelos</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Editar Duelo</CardTitle>
          <CardDescription>
            Modifica los detalles de tu duelo. Los cambios se guardarán al hacer clic en el botón.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDuelForm user={user} state={state} formAction={formAction} duelData={duel} isEditing={true} isPending={isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
