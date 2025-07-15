
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Duel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DuelResultsDetailsProps {
  duel: Duel;
}

export default function DuelResultsDetails({ duel }: DuelResultsDetailsProps) {
  const totalVotes = duel.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {duel.options.map((option) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isWinner =
            duel.options.every((o) => o.votes <= option.votes) &&
            !duel.options.every((o) => o.votes === duel.options[0].votes);
          const hasImage = !!option.imageUrl;

          return (
            <div key={option.id} className="flex flex-col items-center gap-4">
              <Card
                className={cn(
                  'w-full overflow-hidden relative',
                  isWinner && 'border-primary border-4 shadow-lg',
                  !hasImage && 'bg-gradient-to-br from-secondary to-card'
                )}
              >
                <div className="relative aspect-square w-full">
                  {hasImage ? (
                    <Image
                      src={option.imageUrl!}
                      alt={option.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center">
                       <h3 className="text-xl font-bold font-headline text-foreground">{option.title}</h3>
                    </div>
                  )}
                  {isWinner && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                      GANADOR
                    </div>
                  )}
                </div>
              </Card>
              <div className="text-center w-full">
                <h3 className="font-bold text-lg">{option.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {option.votes} Votos ({percentage.toFixed(1)}%)
                </p>
                <Progress value={percentage} className="mt-2 h-3" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground pt-2">
        Total de Votos: {totalVotes}
      </div>
    </div>
  );
}
