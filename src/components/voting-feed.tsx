'use client';

import { useState, useEffect, useTransition } from 'react';
import { ArrowRight, Key } from 'lucide-react';

import DuelCard from './duel-card';
import ResultsChart from './dashboard/results-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { mockDuels, mockUser } from '@/lib/data';
import type { Duel, DuelOption } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function VotingFeed() {
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [voted, setVoted] = useState<DuelOption | null>(null);
  const [keys, setKeys] = useState(mockUser.keys);
  const [animationClass, setAnimationClass] = useState('');
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching duels
    setDuels(mockDuels.filter(d => d.status === 'active'));
  }, []);

  const currentDuel = duels[currentDuelIndex];

  const handleVote = (selectedOption: DuelOption, direction: 'left' | 'right') => {
    if (voted) return;

    setVoted(selectedOption);
    setAnimationClass(direction === 'left' ? 'animate-card-select-left' : 'animate-card-select-right');

    setTimeout(() => {
      startTransition(() => {
        setKeys((prevKeys) => prevKeys + 1);
        toast({
          title: 'Vote Cast!',
          description: (
            <div className="flex items-center">
              You earned a key! <Key className="ml-2 h-4 w-4 text-yellow-500" />
            </div>
          ),
        });
        
        // This opens the results dialog automatically
        document.getElementById(`results-trigger-${currentDuel.id}`)?.click();
      });
    }, 350);
  };
  
  const handleNextDuel = () => {
    setAnimationClass('');
    setVoted(null);
    setCurrentDuelIndex((prevIndex) => (prevIndex + 1) % duels.length);
  };


  if (duels.length === 0) {
    return <VotingFeedSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 border-none bg-transparent shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-headline">{currentDuel.title}</CardTitle>
          <CardDescription className="text-lg">{currentDuel.description}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center justify-center relative perspective-1000", animationClass)}>
        <DuelCard option={currentDuel.options[0]} onClick={() => handleVote(currentDuel.options[0], 'left')} />
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-3 rounded-full shadow-lg z-10">
            <span className="text-xl font-bold text-primary font-headline">VS</span>
        </div>
        <DuelCard option={currentDuel.options[1]} onClick={() => handleVote(currentDuel.options[1], 'right')} />
      </div>

      <div className="text-center mt-8">
        <Dialog>
          <DialogTrigger asChild>
             {/* This button is hidden but can be triggered programmatically */}
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
            <Button onClick={handleNextDuel} className="w-full" size="lg">
              Next Duel <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="aspect-square w-full" />
      </div>
    </div>
  )
}
