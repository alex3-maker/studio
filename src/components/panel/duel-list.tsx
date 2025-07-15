
'use client';

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit, RotateCcw, Clock, CalendarDays, BarChart2, CheckCircle } from "lucide-react";
import type { Duel } from "@/lib/types";
import ResultsChart from "./results-chart";
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
import { useAppContext } from "@/context/app-context";
import DuelResultsDetails from "../duel-results-details";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface DuelListProps {
  duels: Duel[];
}

const statusConfig = {
  active: { text: "Activo", className: "bg-green-500 hover:bg-green-600" },
  closed: { text: "Cerrado", className: "bg-red-500 hover:bg-red-600" },
  scheduled: { text: "Programado", className: "bg-blue-500 hover:bg-blue-600" },
  draft: { text: "Borrador", className: "bg-gray-400 hover:bg-gray-500" },
  inactive: { text: "Inactivo", className: "bg-orange-400 hover:bg-orange-500" },
};

export default function DuelList({ duels }: DuelListProps) {
  const { toggleDuelStatus, deleteDuel, resetDuelVotes, getDuelStatus, activateDraftDuel } = useAppContext();
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const { toast } = useToast();

  const handleRowClick = (duel: Duel) => {
    if (duel.status === 'draft') return; // Do not show results for drafts
    setSelectedDuel(duel);
  };
  
  const handleResetVotes = (e: React.MouseEvent, duelId: string) => {
    e.stopPropagation();
    resetDuelVotes(duelId, true); // true to indicate it's the owner resetting
    toast({
      title: "Votos Reiniciados",
      description: `Los votos para tu duelo han sido reseteados.`,
    });
  }

  const handleActivateDuel = (e: React.MouseEvent, duelId: string) => {
     e.stopPropagation();
     const success = activateDraftDuel(duelId);
      if (success) {
        toast({
          title: "Duelo Activado",
          description: "Tu duelo ha sido activado y ahora está programado para comenzar.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Faltan Llaves",
          description: "No tienes suficientes llaves para activar este duelo. ¡Sigue votando para ganar más!",
        });
      }
  }

  const getTotalVotes = (duel: Duel) => duel.options.reduce((sum, option) => sum + option.votes, 0);

  if (duels.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Mis Duelos</CardTitle>
                 <CardDescription>Aún no has creado ningún duelo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground p-8">
                    <p>¡Anímate y crea tu primer duelo!</p>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Mis Duelos</CardTitle>
        <CardDescription>Aquí puedes ver y gestionar tus duelos. Haz clic en un duelo para ver sus resultados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {duels.map((duel) => {
              const currentStatus = getDuelStatus(duel);
              const statusInfo = statusConfig[currentStatus];

              return (
                 <Card key={duel.id} className="overflow-hidden" onClick={() => handleRowClick(duel)}>
                  <div className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Image & Status */}
                    <div className="flex-shrink-0 w-full md:w-24 flex md:flex-col items-center gap-4">
                        <div className={cn("w-24 h-24 relative", currentStatus !== 'draft' && "cursor-pointer")}>
                           <ResultsChart duel={duel} />
                           {currentStatus !== 'draft' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                  <BarChart2 className="text-white h-8 w-8" />
                              </div>
                           )}
                        </div>
                         <Badge className={cn("w-fit", statusInfo.className)}>
                           {statusInfo.text}
                         </Badge>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-headline mb-1">{duel.title}</CardTitle>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          {currentStatus === 'draft' ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleActivateDuel(e, duel.id)}>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                          ) : (
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleDuelStatus(duel.id); }}>
                                {currentStatus === 'active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/panel/mis-duelos/${duel.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                           <AlertDialog onOpenChange={(open) => !open && event.stopPropagation()}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} disabled={currentStatus === 'draft'}>
                                <RotateCcw className="h-4 w-4 text-blue-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader><AlertDialogTitle>¿Resetear votación?</AlertDialogTitle><AlertDialogDescription>Esta acción pondrá a cero todos los votos para este duelo. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(e) => handleResetVotes(e, duel.id)}>Resetear</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                           <AlertDialog onOpenChange={(open) => !open && event.stopPropagation()}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente tu duelo.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteDuel(duel.id); }}>Eliminar</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Footer Info */}
                       <div className="border-t mt-2 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {duel.createdAt && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            <span>Creado {format(new Date(duel.createdAt), "dd MMM yyyy", { locale: es })}</span>
                          </div>
                        )}
                        {duel.endsAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                                {currentStatus === 'draft' ? 'Pendiente de activación' : `Cierra ${formatDistanceToNow(new Date(duel.endsAt), { locale: es, addSuffix: true })}`}
                            </span>
                          </div>
                        )}
                         <div className="flex items-center gap-1 font-semibold">
                          <BarChart2 className="h-3 w-3" />
                          <span>{getTotalVotes(duel)} Votos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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
