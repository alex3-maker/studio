
'use client';

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit, RotateCcw, Clock, CalendarDays, BarChart2, CheckCircle, X } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";

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
  const { toggleDuelStatus, deleteDuel, resetDuelVotes, getDuelStatus, activateDraftDuel, deleteMultipleDuels } = useAppContext();
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const [selectedDuelIds, setSelectedDuelIds] = useState<string[]>([]);
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

  const handleSelectDuel = (duelId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDuelIds(prev => [...prev, duelId]);
    } else {
      setSelectedDuelIds(prev => prev.filter(id => id !== duelId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedDuelIds(duels.map(d => d.id));
    } else {
      setSelectedDuelIds([]);
    }
  };

  const handleDeleteSelected = () => {
    const count = selectedDuelIds.length;
    deleteMultipleDuels(selectedDuelIds);
    setSelectedDuelIds([]);
    toast({
      title: "Duelos Eliminados",
      description: `Se han eliminado ${count} duelo(s) correctamente.`,
    });
  };

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

  const areAllSelected = duels.length > 0 && selectedDuelIds.length === duels.length;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Mis Duelos</CardTitle>
        <CardDescription>Aquí puedes ver y gestionar tus duelos. Haz clic en un duelo para ver sus resultados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {selectedDuelIds.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                    <div className="text-sm font-medium">
                        {selectedDuelIds.length} duelo(s) seleccionado(s)
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Seleccionados
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará permanentemente los {selectedDuelIds.length} duelos seleccionados y no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>Sí, Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            <div className="flex items-center px-4 py-2 border-b">
                <Checkbox
                    id="select-all"
                    checked={areAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Seleccionar todos los duelos"
                    className="mr-4"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-muted-foreground cursor-pointer">
                    Seleccionar todos
                </label>
            </div>
          {duels.map((duel) => {
              const currentStatus = getDuelStatus(duel);
              const statusInfo = statusConfig[currentStatus];

              return (
                 <Card key={duel.id} className="overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <Checkbox
                        id={`select-${duel.id}`}
                        checked={selectedDuelIds.includes(duel.id)}
                        onCheckedChange={(checked) => handleSelectDuel(duel.id, Boolean(checked))}
                        aria-label={`Seleccionar duelo ${duel.title}`}
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    />
                     {/* Chart & Status */}
                    <div className="flex flex-row md:flex-col items-center justify-center gap-4 flex-shrink-0 w-full md:w-24 cursor-pointer" onClick={() => handleRowClick(duel)}>
                       <div className={cn("w-24 h-24 relative", currentStatus !== 'draft' && "cursor-pointer")}>
                           <ResultsChart duel={duel} />
                           {currentStatus !== 'draft' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                  <BarChart2 className="text-white h-8 w-8" />
                              </div>
                           )}
                        </div>
                        <Badge className={cn("w-fit md:w-full text-center justify-center", statusInfo.className)}>
                           {statusInfo.text}
                        </Badge>
                    </div>

                    {/* Title & Details */}
                    <div className="flex-grow w-full min-w-0 cursor-pointer" onClick={() => handleRowClick(duel)}>
                      <CardTitle className="text-xl font-headline mb-2 break-words">{duel.title}</CardTitle>
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
                                {currentStatus === 'draft' ? 'Pendiente' : `Cierra ${formatDistanceToNow(new Date(duel.endsAt), { locale: es, addSuffix: true })}`}
                            </span>
                          </div>
                        )}
                         <div className="flex items-center gap-1 font-semibold">
                          <BarChart2 className="h-3 w-3" />
                          <span>{getTotalVotes(duel)} Votos</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row md:flex-col items-center justify-center gap-1 self-start md:self-center pt-2 md:pt-0">
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
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} disabled={currentStatus === 'draft'}>
                            <RotateCcw className="h-4 w-4 text-blue-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader><AlertDialogTitle>¿Resetear votación?</AlertDialogTitle><AlertDialogDescription>Esta acción pondrá a cero todos los votos para este duelo. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => handleResetVotes(e, duel.id)}>Resetear</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente tu duelo.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteDuel(duel.id); }}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
