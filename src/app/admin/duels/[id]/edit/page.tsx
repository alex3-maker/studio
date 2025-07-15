
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateDuelAction } from '@/lib/actions';
import { useAppContext } from '@/context/app-context';
import CreateDuelForm from '@/components/create-duel-form';
import { Skeleton } from '@/components/ui/skeleton';

const initialState = {
  message: '',
  success: false,
  errors: {},
};

export default function EditDuelPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { duels, updateDuel } = useAppContext();
  const [state, formAction] = useActionState(updateDuelAction, initialState);

  const duel = duels.find(d => d.id === params.id);

  useEffect(() => {
    if (state.success && state.updatedDuel) {
      updateDuel(state.updatedDuel);
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      router.push('/admin/duels');
    } else if (state.message && !state.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Editar Duelo</CardTitle>
            <CardDescription>
              Modifica los detalles del duelo. Los cambios se guardarán al hacer clic en el botón.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDuelForm state={state} formAction={formAction} duelData={duel} isEditing={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
