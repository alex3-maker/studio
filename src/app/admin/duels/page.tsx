
'use client';

import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import ResultsChart from "@/components/panel/results-chart";
import DuelResultsDetails from "@/components/duel-results-details";
import type { Duel } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AdminDuelsPage() {
  const { duels, toggleDuelStatus, deleteDuel, resetDuelVotes } = useAppContext();
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const { toast } = useToast();

  const handleRowClick = (duel: Duel) => {
    setSelectedDuel(duel);
  };

  const handleResetVotes = (e: React.MouseEvent, duelId: string) => {
    e.stopPropagation();
    resetDuelVotes(duelId);
    toast({
      title: "Votos Reiniciados",
      description: `Los votos para el duelo han sido reseteados.`,
    });
  }
  
  const getTotalVotes = (duel: Duel) => duel.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Gestionar Duelos</CardTitle>
          <CardDescription>Visualiza, activa, cierra, edita y elimina duelos de todos los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {duels.map((duel) => (
              <div
                key={duel.id}
                onClick={() => handleRowClick(duel)}
                className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {/* Control Column */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full md:w-28">
                  <div className="w-20 h-20">
                    <ResultsChart duel={duel} />
                  </div>
                  <Badge variant={duel.status === 'active' ? 'default' : 'secondary'} className="w-fit mb-2">
                    {duel.status === 'active' ? 'Activo' : 'Cerrado'}
                  </Badge>
                  <Separator className="md:hidden my-2" />
                  {/* Actions */}
                  <div className="flex justify-center items-center space-x-2 md:flex-col md:space-x-0 md:space-y-2 w-full">
                    <Button asChild variant="outline" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/duels/${duel.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Duelo</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleDuelStatus(duel.id); }}>
                      {duel.status === 'active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                      <span className="sr-only">{duel.status === 'active' ? 'Cerrar Duelo' : 'Activar Duelo'}</span>
                    </Button>
                    <AlertDialog onOpenChange={(open) => !open && event.stopPropagation()}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <RotateCcw className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Resetear Votos</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Resetear votación?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción pondrá a cero todos los votos para este duelo. No se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={(e) => handleResetVotes(e, duel.id)}>Resetear</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog onOpenChange={(open) => !open && event.stopPropagation()}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar Duelo</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el duelo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={(e) => {e.stopPropagation(); deleteDuel(duel.id)}}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block h-auto mx-2" />
                

                {/* Content Column */}
                <div className="flex-grow text-center md:text-left pt-4 md:pt-0 border-t md:border-none w-full">
                  <p className="font-bold text-xl leading-tight">{duel.title}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creado por: {duel.creator.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Votos totales: {getTotalVotes(duel)}
                  </p>
                </div>
              </div>
            ))}
            {duels.length === 0 && (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                    No hay duelos para mostrar.
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Results Dialog */}
      <AlertDialog open={!!selectedDuel} onOpenChange={(open) => !open && setSelectedDuel(null)}>
        <AlertDialogContent className="max-w-2xl">
          {selectedDuel && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Resultados: {selectedDuel.title}</AlertDialogTitle>
                <AlertDialogDescription>{selectedDuel.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <DuelResultsDetails duel={selectedDuel} />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedDuel(null)}>Cerrar</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
