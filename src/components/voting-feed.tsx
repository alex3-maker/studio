'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { ArrowRight, Key, Smartphone, X } from 'lucide-react';

import DuelCard from './duel-card';
import ResultsChart from './panel/results-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { DuelOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const HINT_STORAGE_KEY = 'duelDash-landscape-hint-dismissed';

export default function VotingFeed() {
  const { duels, castVote } = useAppContext();
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [voted, setVoted] = useState<DuelOption | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Show hint only on mobile and if not previously dismissed
    if (window.innerWidth < 768) {
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

  const activeDuels = useMemo(() => duels.filter(d => d.status === 'active'), [duels]);
  const currentDuel = activeDuels[currentDuelIndex];

  const handleVote = (selectedOption: DuelOption, direction: 'left' | 'right') => {
    if (voted || !currentDuel) return;

    setVoted(selectedOption);
    setAnimationClass(direction === 'left' ? 'animate-card-select-left' : 'animate-card-select-right');

    setTimeout(() => {
      startTransition(() => {
        castVote(currentDuel.id, selectedOption.id);
        toast({
          title: 'Vote Cast!',
          description: (
            <div className="flex items-center">
              You earned a key! <Key className="ml-2 h-4 w-4 text-yellow-500" />
            </div>
          ),
        });
        
        document.getElementById(`results-trigger-${currentDuel.id}`)?.click();
      });
    }, 350);
  };
  
  const handleNextDuel = () => {
    setAnimationClass('');
    setVoted(null);
    setCurrentDuelIndex((prevIndex) => (prevIndex + 1) % activeDuels.length);
    document.getElementById(`results-close-${currentDuel.id}`)?.click();
  };


  if (activeDuels.length === 0) {
    return (
       <div className="text-center py-16">
        <h2 className="text-2xl font-headline mb-4">No More Duels!</h2>
        <p className="text-muted-foreground">You've voted on all available duels. Check back later or create your own!</p>
      </div>
    )
  }

  if (!currentDuel) {
    return <VotingFeedSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {showHint && (
        <Alert className="mb-4 relative md:hidden">
          <Smartphone className="h-4 w-4" />
          <AlertTitle>Mejor en horizontal</AlertTitle>
          <AlertDescription>
            Para una mejor experiencia, gira tu dispositivo.
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
          <CardTitle className="text-3xl md:text-4xl font-headline">{currentDuel.title}</CardTitle>
          <CardDescription className="text-lg">{currentDuel.description}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className={cn("grid grid-cols-2 gap-4 md:gap-8 items-center justify-center relative perspective-1000", animationClass)}>
        <DuelCard option={currentDuel.options[0]} onClick={() => handleVote(currentDuel.options[0], 'left')} />
        <div className="flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-3 rounded-full shadow-lg z-10">
            <span className="text-xl font-bold text-primary font-headline">VS</span>
        </div>
        <DuelCard option={currentDuel.options[1]} onClick={() => handleVote(currentDuel.options[1], 'right')} />
      </div>

      <div className="text-center mt-8">
        <Dialog onOpenChange={(open) => {
          if (!open) {
            handleNextDuel();
          }
        }}>
          <DialogTrigger asChild>
             <Button id={`results-trigger-${currentDuel.id}`} className="hidden" variant="outline">
                View Results
              </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Results: {currentDuel.title}</DialogTitle>
            </DialogHeader>
            <div className="h-64 w-full">
              <ResultsChart duel={currentDuel} />
            </div>
            <DialogClose asChild>
              <Button id={`results-close-${currentDuel.id}`} onClick={handleNextDuel} className="w-full" size="lg">
                Next Duel <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {voted && (
          <p className="text-lg font-semibold text-primary">
            You voted for: {voted.title}
          </p>
        )}
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
