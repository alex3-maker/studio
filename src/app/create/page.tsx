'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateDuelForm from "@/components/create-duel-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { createDuelAction } from '@/lib/actions';
import { useActionState } from 'react';

const initialState = {
  message: '',
  success: false,
  errors: {},
};

export default function CreateDuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(createDuelAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      // Redirect to dashboard on successful creation
      router.push('/dashboard');
    } else if (state.message && !state.success) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Create a New Duel</CardTitle>
            <CardDescription>
              Fill out the form below to launch your duel. Your content will be automatically checked for safety.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDuelForm state={state} formAction={formAction} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
