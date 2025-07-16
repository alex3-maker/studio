
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


export default function VotingFeed() {
  const { duels, castVote, votedDuelIds, getDuelStatus } = useAppContext();
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [voted, setVoted] = useState<DuelOption | null>(null);
  const [votedDuelDetails, setVotedDuelDetails] = useState<Duel | null>(null);
  const [animationClass, setAnimationClass] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showHint, setShowHint] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Mostrar pista solo en móvil y si no se ha descartado previamente
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

  const activeDuels = useMemo(() => 
    duels.filter(d => {
        const status = getDuelStatus(d);
        return status === 'active' && !votedDuelIds.includes(d.id)
    }), 
  [duels, votedDuelIds, getDuelStatus]);

  const currentDuel: Duel | undefined = useMemo(() => {
    if (activeDuels.length === 0) return undefined;
    
    // Si hay un duelo votado, seguimos mostrándolo hasta que se cierre el diálogo
    if (votedDuelDetails) {
        return votedDuelDetails;
    }

    // Asegurarse de que el índice no esté fuera de los límites
    const newIndex = Math.min(currentDuelIndex, activeDuels.length - 1);
    if (newIndex !== currentDuelIndex) {
        setCurrentDuelIndex(newIndex);
    }
    return activeDuels[newIndex];
  }, [activeDuels, currentDuelIndex, votedDuelDetails]);


  const handleVote = (selectedOption: DuelOption, direction?: 'left' | 'right') => {
    if (voted || !currentDuel) return;
    
    setVotedDuelDetails(currentDuel);
    setVoted(selectedOption);
    if(direction){
        setAnimationClass(direction === 'left' ? 'animate-card-select-left' : 'animate-card-select-right');
    }

    setTimeout(() => {
      startTransition(() => {
        const awardedKey = castVote(currentDuel.id, selectedOption.id);
        
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
  
  const onDialogClose = (open: boolean) => {
    if(!open) {
      setIsDialogOpen(false);
      // Cuando el diálogo se cierra (tras ver los resultados), pasamos al siguiente duelo.
      setAnimationClass('');
      setVoted(null);
      setVotedDuelDetails(null);

      // La lista de activeDuels ya se ha actualizado. Si estamos al final, volvemos al principio.
      // Si no, el índice actual ya apunta al siguiente duelo correcto.
      if (currentDuelIndex >= activeDuels.length - 1) {
          setCurrentDuelIndex(0);
      }
    }
  }


  if (!votedDuelIds) { // Loading state while context loads from localstorage
    return <VotingFeedSkeleton />;
  }
  
  // Condición de fin de duelos, pero solo si no estamos viendo los resultados de un voto
  if (activeDuels.length === 0 && !votedDuelDetails) {
    return (
       <div className="text-center py-16">
        <h2 className="text-2xl font-headline mb-4">¡No hay más duelos!</h2>
        <p className="text-muted-foreground">Has votado en todos los duelos disponibles. ¡Vuelve más tarde o crea el tuyo!</p>
      </div>
    )
  }

  if (!currentDuel) {
    // Esto puede pasar brevemente si el último duelo es votado
    return (
        <div className="text-center py-16">
         <h2 className="text-2xl font-headline mb-4">Cargando...</h2>
       </div>
     )
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
          <CardTitle className="text-3xl md:text-4xl font-headline">{currentDuel.title}</CardTitle>
          {currentDuel.description && (
             <CardDescription className="text-lg">{currentDuel.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
      
      <div className={cn(animationClass)}>
        {currentDuel.type === 'A_VS_B' ? (
          <A_VS_B_Duel duel={currentDuel} onVote={(option, direction) => handleVote(option, direction)} />
        ) : (
          <ListDuel duel={currentDuel} onVote={(option) => handleVote(option)} />
        )}
      </div>


      <div className="text-center mt-8">
        <Dialog open={isDialogOpen} onOpenChange={onDialogClose}>
          <DialogContent className="max-w-2xl">
            {votedDuelDetails && (
              <>
                <DialogHeader>
                  <DialogTitle>Resultados: {votedDuelDetails.title}</DialogTitle>
                </DialogHeader>
                <DuelResultsDetails duel={votedDuelDetails} />
                <DialogClose asChild>
                  <Button id={`results-close-${currentDuel.id}`} className="w-full" size="lg">
                    Siguiente Duelo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogClose>
              </>
            )}
          </DialogContent>
        </Dialog>

        {voted && (
          <p className="text-lg font-semibold text-primary">
            Has votado por: {voted.title}
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
