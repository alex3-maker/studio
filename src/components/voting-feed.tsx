
'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { ArrowRight, Key, Smartphone, X } from 'lucide-react';

import DuelCard from './duel-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Duel, DuelOption, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import DuelResultsDetails from './duel-results-details';
import { castVoteAction } from '@/lib/actions';

const HINT_STORAGE_KEY = 'dueliax-landscape-hint-dismissed';
const GUEST_VOTED_DUELS_STORAGE_KEY = 'dueliax_guest_voted_duels';

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

interface VotingFeedProps {
    initialDuels: Duel[];
    initialUsers: User[];
    userId?: string;
}

export default function VotingFeed({ initialDuels, initialUsers, userId }: VotingFeedProps) {
  const { setDuels, setUsers, getDuelStatus, updateDuel, duels: contextDuels } = useAppContext();
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [votedDuelDetails, setVotedDuelDetails] = useState<Duel | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showHint, setShowHint] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientVotedIds, setClientVotedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Initialize context and local state from server-passed props
  useEffect(() => {
      setDuels(initialDuels);
      setUsers(initialUsers);
      try {
        const guestVotes = JSON.parse(localStorage.getItem(GUEST_VOTED_DUELS_STORAGE_KEY) || '[]');
        setClientVotedIds(new Set(guestVotes));
      } catch (e) {
        console.error("Could not parse guest votes from local storage", e);
        setClientVotedIds(new Set());
      }
  }, [initialDuels, initialUsers, setDuels, setUsers]);
  
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
    contextDuels.filter(d => {
        const status = getDuelStatus(d);
        // For guests, we check a localstorage list of voted duel IDs.
        // For logged-in users, the server action will prevent re-voting.
        const hasVotedAsGuest = !userId && clientVotedIds.has(d.id);
        return status === 'active' && !hasVotedAsGuest;
    }), 
  [contextDuels, getDuelStatus, clientVotedIds, userId]);

  const currentDuel: Duel | undefined = activeDuels[currentDuelIndex];

  const handleVote = (selectedOption: DuelOption, direction?: 'left' | 'right') => {
    if (votedDuelDetails || !currentDuel) return;
    
    if(direction){
        setAnimationClass(direction === 'left' ? 'animate-card-select-left' : 'animate-card-select-right');
    }

    setTimeout(() => {
      startTransition(async () => {
        const result = await castVoteAction({ duelId: currentDuel.id, optionId: selectedOption.id });
        
        if(result.error) {
            toast({
                variant: "destructive",
                title: "Error al votar",
                description: result.error,
            });
            setAnimationClass(''); // Reset animation if vote fails
            return;
        }
        
        // If the vote was registered as a guest, add it to our local list to filter it out next time.
        if (result.voteRegisteredForGuest) {
          const newVotedIds = new Set(clientVotedIds).add(currentDuel.id);
          setClientVotedIds(newVotedIds);
          localStorage.setItem(GUEST_VOTED_DUELS_STORAGE_KEY, JSON.stringify(Array.from(newVotedIds)));
        }
        
        if (result.updatedDuel) {
          setVotedDuelDetails(result.updatedDuel);
          updateDuel(result.updatedDuel); // Update context for other components
        }

        toast({
          duration: 3000,
          title: '¡Voto registrado!',
          description: result.awardedKey ? (
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

        // Logic to advance to the next duel
        if (currentDuelIndex >= activeDuels.length - 1) {
            // If we're at the end, just stay here. The list of activeDuels will shrink,
            // effectively showing the "no more duels" message.
            // We set index to 0 as a fallback.
            setCurrentDuelIndex(0); 
        } else {
            // Otherwise, we just advance. No need to increment, as the current duel
            // will be filtered out from activeDuels, and the next one will take its place.
            // The component will re-render with the new list.
        }
      }, 300);
  }

  const duelToShow = votedDuelDetails || currentDuel;
  
   if (isPending && !votedDuelDetails) {
     return <VotingFeedSkeleton />;
   }

  if (activeDuels.length === 0) {
      return (
          <div className="text-center py-16">
              <h2 className="text-2xl font-headline mb-4">¡No hay más duelos!</h2>
              <p className="text-muted-foreground">Has votado en todos los duelos disponibles. ¡Vuelve más tarde o crea el tuyo!</p>
          </div>
      )
  }

  if (!duelToShow) {
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
                <AutoAdvanceButton onComplete={handleDialogClose} hasMoreDuels={activeDuels.length > 1} />
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
