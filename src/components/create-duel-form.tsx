'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';

import { createDuelSchema, type CreateDuelFormValues } from '@/lib/schemas';
import { createDuelAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
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
import { Terminal } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating Duel...' : 'Create Duel'}
    </Button>
  );
}

export default function CreateDuelForm() {
  const [state, formAction] = useFormState(createDuelAction, initialState);
  const { toast } = useToast();

  const form = useForm<CreateDuelFormValues>({
    resolver: zodResolver(createDuelSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'A_VS_B',
      options: [
        { title: '', imageUrl: 'https://placehold.co/600x600.png' },
        { title: '', imageUrl: 'https://placehold.co/600x600.png' },
      ],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      form.reset();
    } else if (state.message && !state.success) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.message,
      });
    }
  }, [state, toast, form]);


  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duel Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Best Sci-Fi Movie of All Time" {...field} />
              </FormControl>
              <FormDescription>A catchy title for your duel.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Add a short description for context." {...field} />
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
              <FormLabel>Duel Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a duel format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="A_VS_B">A vs B</SelectItem>
                  <SelectItem value="LIST" disabled>List (Coming Soon)</SelectItem>
                  <SelectItem value="KING_OF_THE_HILL" disabled>King of the Hill (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Currently, only A vs B is available.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />

        <div className="space-y-4">
            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardHeader>
                        <CardTitle>Option {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name={`options.${index}.title`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Option Title</FormLabel>
                                    <FormControl><Input placeholder={`Title for option ${index + 1}`} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`options.${index}.imageUrl`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            ))}
        </div>
        
        {state.errors?.moderation && (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Content Moderation Error</AlertTitle>
                <AlertDescription>{state.errors.moderation}</AlertDescription>
            </Alert>
        )}

        <SubmitButton />
      </form>
    </Form>
  );
}
