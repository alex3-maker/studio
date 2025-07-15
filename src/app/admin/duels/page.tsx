
'use client';

import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit, RotateCcw, Clock, CalendarDays, BarChart2, CheckCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { text: "Activo", className: "bg-green-500 hover:bg-green-600" },
  closed: { text: "Cerrado", className: "bg-red-500 hover:bg-red-600" },
  scheduled: { text: "Programado", className: "bg-blue-500 hover:bg-blue-600" },
  draft: { text: "Borrador", className: "bg-gray-400 hover:bg-gray-500" },
};


export default function AdminDuelsPage() {
  const { duels, toggleDuelStatus, deleteDuel, resetDuelVotes, getDuelStatus, activateDraftDuel } = useAppContext();
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
      description: `Los votos para el duelo han sido reseteados. (Notificación simulada a usuarios)`,
    });
  }

  const handleActivateDuel = (e: React.MouseEvent, duelId: string) => {
     e.stopPropagation();
     const success = activateDraftDuel(duelId);
      if (success) {
        toast({
          title: "Duelo Activado",
          description: "El duelo ahora está programado y será visible en su fecha de inicio.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al Activar",
          description: "No se pudo activar el duelo. ¿Tiene el creador suficientes llaves?",
        });
      }
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
            {duels.map((duel) => {
              const currentStatus = getDuelStatus(duel);
              const statusInfo = statusConfig[currentStatus];

              return (
                <Card key={duel.id} className="overflow-hidden">
                  <div className="p-4 flex flex-col md:flex-row gap-4">
                    {/* Image & Status */}
                    <div className="flex-shrink-0 w-full md:w-24 flex md:flex-col items-center gap-4">
                        <div className="w-24 h-24 relative cursor-pointer" onClick={() => handleRowClick(duel)}>
                           <ResultsChart duel={duel} />
                           <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                <BarChart2 className="text-white h-8 w-8" />
                            </div>
                        </div>
                         <Badge className={cn("w-fit", statusInfo.className)}>
                           {statusInfo.text}
                         </Badge>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-headline mb-1">{duel.title}</CardTitle>
                           <CardDescription>
                            Creado por: {duel.creator.name}
                          </CardDescription>
                        </div>
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
                            <Link href={`/admin/duels/${duel.id}/edit`}>
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
                              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el duelo.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={(e) => {e.stopPropagation(); deleteDuel(duel.id)}}>Eliminar</AlertDialogAction></AlertDialogFooter>
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
              )
            })}
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
