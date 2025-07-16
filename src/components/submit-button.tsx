
'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  className?: string;
}

export function SubmitButton({ label, pendingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className || 'w-full'}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
