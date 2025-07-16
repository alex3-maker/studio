
'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DuelOption } from '@/lib/types';
import { Link2 } from 'lucide-react';
import { Button } from './ui/button';

interface DuelCardProps {
  option: DuelOption;
  onClick: () => void;
  className?: string;
}

export default function DuelCard({ option, onClick, className }: DuelCardProps) {
  const hasImage = !!option.imageUrl;

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que se active el voto al hacer clic en el enlace
    if (option.affiliateUrl) {
      window.open(option.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      className={cn(
        'w-full cursor-pointer overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105 group border-4 border-transparent hover:border-primary',
        !hasImage && 'bg-gradient-to-br from-secondary to-card',
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <CardContent className="p-0 relative aspect-square">
        {hasImage ? (
          <>
            <Image
              src={option.imageUrl!}
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
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-center">
            <h3 className="text-3xl font-bold font-headline text-foreground">
              {option.title}
            </h3>
          </div>
        )}
        {option.affiliateUrl && (
            <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={handleLinkClick}
                aria-label="Ver enlace"
            >
                <Link2 className="h-4 w-4" />
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
