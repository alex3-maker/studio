import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DuelOption } from '@/lib/types';

interface DuelCardProps {
  option: DuelOption & { 'data-ai-hint'?: string };
  onClick: () => void;
  className?: string;
}

export default function DuelCard({ option, onClick, className }: DuelCardProps) {
  return (
    <Card
      className={cn(
        'w-full cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 group border-4 border-transparent hover:border-primary',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <CardContent className="p-0 relative aspect-square">
        <Image
          src={option.imageUrl}
          alt={option.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          data-ai-hint={option['data-ai-hint']}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <h3 className="absolute bottom-4 left-4 right-4 text-2xl font-bold font-headline text-white drop-shadow-lg">
          {option.title}
        </h3>
      </CardContent>
    </Card>
  );
}
