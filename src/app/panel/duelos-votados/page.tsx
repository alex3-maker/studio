
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote } from 'lucide-react';
import VotedDuelCard from '@/components/panel/voted-duel-card';

export default function VotedDuelsPage() {
  const { duels, userVotedOptions } = useAppContext();

  const votedDuels = useMemo(() => {
    const votedDuelIds = Object.keys(userVotedOptions);
    return duels.filter(duel => votedDuelIds.includes(duel.id)).sort((a, b) => {
        // Sort by most recently voted first by finding the latest timestamp
        const aTimestamp = new Date(userVotedOptions[a.id]?.timestamp || 0).getTime();
        const bTimestamp = new Date(userVotedOptions[b.id]?.timestamp || 0).getTime();
        return bTimestamp - aTimestamp;
    });
  }, [duels, userVotedOptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Duelos Votados</CardTitle>
        <CardDescription>
          Aquí puedes seguir en tiempo real los resultados de los duelos en los que has participado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {votedDuels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {votedDuels.map(duel => (
              <VotedDuelCard 
                key={duel.id} 
                duel={duel} 
                votedOptionId={userVotedOptions[duel.id]?.optionId} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4">
             <Vote className="w-16 h-16" />
            <h3 className="text-xl font-semibold">Aún no has votado</h3>
            <p>Tus duelos participados aparecerán aquí. ¡Ve a la página de inicio para empezar a votar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
