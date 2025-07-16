
'use client';

import type { Duel } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface VotedDuelCardProps {
  duel: Duel;
  votedOptionId?: string;
}

export default function VotedDuelCard({ duel, votedOptionId }: VotedDuelCardProps) {
  const { getDuelStatus } = useAppContext();
  const totalVotes = duel.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  const currentStatus = getDuelStatus(duel);
  
  const getWinner = () => {
    if (currentStatus !== 'CLOSED') return null;
    if (duel.options.length < 2) return null;
    const sortedOptions = [...duel.options].sort((a,b) => (b.votes || 0) - (a.votes || 0));
    if ((sortedOptions[0].votes || 0) > (sortedOptions[1].votes || 0)) {
      return sortedOptions[0];
    }
    return null; // Tie or no winner
  };

  const winner = getWinner();

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'ACTIVE':
        return { text: `Activo - Cierra ${formatDistanceToNow(new Date(duel.endsAt), { locale: es, addSuffix: true })}`, className: "bg-green-500/20 text-green-700" };
      case 'CLOSED':
        return { text: "Cerrado", className: "bg-red-500/20 text-red-700" };
      case 'SCHEDULED':
         return { text: `Programado - Empieza ${formatDistanceToNow(new Date(duel.startsAt), { locale: es, addSuffix: true })}`, className: "bg-blue-500/20 text-blue-700" };
      default:
        return { text: "Inactivo", className: "bg-gray-400/20 text-gray-700" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-lg leading-tight">{duel.title}</CardTitle>
        <Badge variant="outline" className={cn("w-fit mt-2", statusInfo.className)}>{statusInfo.text}</Badge>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        {duel.options.map(option => {
          const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;
          const userVotedForThis = option.id === votedOptionId;
          const isWinner = winner && winner.id === option.id;

          return (
            <div key={option.id}>
              <div className="flex justify-between items-center mb-1 text-sm">
                <div className="flex items-center gap-2 font-medium">
                   {userVotedForThis && (
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-label="Tu voto" />
                    )}
                  <span className={cn(userVotedForThis && "text-primary")}>{option.title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                    <span className="font-semibold">{option.votes || 0}</span>
                </div>
              </div>
              <Progress value={percentage} className={cn(userVotedForThis && "[&>div]:bg-primary")} />
            </div>
          );
        })}
      </CardContent>
      <CardFooter>
        <CardDescription>Total de {totalVotes} votos</CardDescription>
      </CardFooter>
    </Card>
  );
}
