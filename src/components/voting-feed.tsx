
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { ArrowRight, Key, Smartphone, X } from 'lucide-react';

import DuelCard from './duel-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import type { Duel, DuelOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import DuelResultsDetails from './duel-results-details';
import { useSession } from 'next-auth/react';

const HINT_STORAGE_KEY = 'dueliax-landscape-hint-dismissed';


// Component for "A vs B" duel type
function A_VS_B_Duel({ duel, onVote }: { duel: Duel, onVote: (option: DuelOption, direction: 'left' | 'right') => void }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-8 items-center justify-center relative perspective-1000">
      <DuelCard option={duel.options[0]} onClick={() => onVote(duel.options[0], 'left')} />
      <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-3 rounded-full shadow-lg z-10">
        <span className="text-xl font-bold text-primary font-headline">VS</span>
      </div>
      <DuelCard option={duel.options[1]} onClick={() => onVote(duel.options[1], 'right')} />
    </div>
  )
}

// Component for "List" duel type
function ListDuel({ duel, onVote }: { duel: Duel, onVote: (option: DuelOption) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {duel.options.map((option) => (
        <Card key={option.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onVote(option)}>
          <CardContent className="p-4 flex items-center gap-4">
            {option.imageUrl && (
              <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <img src={option.imageUrl} alt={option.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="text-lg font-semibold">{option.title}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AutoAdvanceButton({ onComplete, hasMoreDuels }: { onComplete: () => void; hasMoreDuels: boolean; }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    // Update progress every 30ms for a smooth 3-second animation
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <Button onClick={onComplete} className="w-full relative overflow-hidden" size="lg">
      <div className="absolute top-0 left-0 h-full bg-primary-foreground/30" style={{ width: `${progress}%` }} />
      <span className="relative z-10 flex items-center">
        {hasMoreDuels ? 'Siguiente Duelo' : 'Finalizar'}
        <ArrowRight className="ml-2 h-4 w-4" />
      </span>
    </Button>
  );
}


export default function VotingFeed() {
  const { data: session } = useSession();
  const { duels, castVote, votedDuelIds, getDuelStatus } = useAppContext();
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [votedDuelDetails, setVotedDuelDetails] = useState<Duel | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showHint, setShowHint] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const hintDismissed = localStorage.getItem(HINT_STORAGE_KEY);
      if (hintDismissed !== 'true') {
        setShowHint(true);
      }
    }
  }, []);

  const dismissHint = () => {
    localStorage.setItem(HINT_STORAGE_KEY, 'true');
    setShowHint(false);
  };

  const activeDuels = useMemo(() => 
    duels.filter(d => {
        const status = getDuelStatus(d);
        return status === 'active' && !votedDuelIds.includes(d.id)
    }), 
  [duels, votedDuelIds, getDuelStatus]);

  const currentDuel: Duel | undefined = useMemo(() => {
    if (activeDuels.length === 0) return undefined;
    const newIndex = Math.min(currentDuelIndex, activeDuels.length - 1);
    if (newIndex !== currentDuelIndex) {
        setCurrentDuelIndex(newIndex);
    }
    return activeDuels[newIndex];
  }, [activeDuels, currentDuelIndex]);


  const handleVote = (selectedOption: DuelOption, direction?: 'left' | 'right') => {
    if (votedDuelDetails || !currentDuel || !session?.user) return;
    
    if(direction){
        setAnimationClass(direction === 'left' ? 'animate-card-select-left' : 'animate-card-select-right');
    }

    setTimeout(() => {
      startTransition(() => {
        const { awardedKey, updatedDuel } = castVote(currentDuel.id, selectedOption.id, session.user.id);
        
        if (updatedDuel) {
          setVotedDuelDetails(updatedDuel);
        }

        toast({
          duration: 3000,
          title: '¡Voto registrado!',
          description: awardedKey ? (
            <div className="flex items-center">
              ¡Has ganado una llave! <Key className="ml-2 h-4 w-4 text-yellow-500" />
            </div>
          ) : (
            <div>Tu voto ha sido contado.</div>
          ),
        });
        
        setIsDialogOpen(true);
      });
    }, currentDuel.type === 'A_VS_B' ? 350 : 100);
  };
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      
      setTimeout(() => {
        setAnimationClass('');
        setVotedDuelDetails(null);

        if (currentDuelIndex >= activeDuels.length - 1) {
            setCurrentDuelIndex(0);
        }
      }, 300);
  }

  const duelToShow = votedDuelDetails || currentDuel;
  
   if (isPending) {
     return <VotingFeedSkeleton />;
   }

  if (!duelToShow) {
     if (duels.length > 0 && activeDuels.length === 0) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-headline mb-4">¡No hay más duelos!</h2>
                <p className="text-muted-foreground">Has votado en todos los duelos disponibles. ¡Vuelve más tarde o crea el tuyo!</p>
            </div>
        )
     }
     return <VotingFeedSkeleton />;
  }


  return (
    <div className="max-w-4xl mx-auto">
      {showHint && (
        <Alert className="mb-4 relative md:hidden">
          <Smartphone className="h-4 w-4" />
          <AlertTitle>Mejor en horizontal</AlertTitle>
          <AlertDescription>
            Para una mejor experiencia en duelos de 2 opciones, gira tu dispositivo.
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={dismissHint}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <Card className="mb-8 border-none bg-transparent shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-headline">{duelToShow.title}</CardTitle>
          {duelToShow.description && (
             <CardDescription className="text-lg">{duelToShow.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
      
      <div className={cn(animationClass)}>
        {duelToShow.type === 'A_VS_B' ? (
          <A_VS_B_Duel duel={duelToShow} onVote={(option, direction) => handleVote(option, direction)} />
        ) : (
          <ListDuel duel={duelToShow} onVote={(option) => handleVote(option)} />
        )}
      </div>


      <div className="text-center mt-8">
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent className="max-w-2xl">
            {votedDuelDetails && (
              <>
                <DialogHeader>
                  <DialogTitle>Resultados: {votedDuelDetails.title}</DialogTitle>
                </DialogHeader>
                <DuelResultsDetails duel={votedDuelDetails} />
                <AutoAdvanceButton onComplete={handleDialogClose} hasMoreDuels={activeDuels.length > 0} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function VotingFeedSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 border-none bg-transparent shadow-none">
        <CardHeader className="text-center">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 gap-4 md:gap-8">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="aspect-square w-full" />
      </div>
    </div>
  )
}
