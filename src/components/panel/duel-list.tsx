
'use client';

import Link from "next/link";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit, RotateCcw, Clock, CalendarDays, BarChart2, CheckCircle, X, ShieldQuestion } from "lucide-react";
import type { Duel, User } from "@/lib/types";
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
import { useSession } from "next-auth/react";

interface DuelListProps {
  duels: Duel[];
}

const statusConfig = {
  ACTIVE: { text: "Activo", className: "bg-green-500 hover:bg-green-600" },
  CLOSED: { text: "Cerrado", className: "bg-red-500 hover:bg-red-600" },
  SCHEDULED: { text: "Programado", className: "bg-blue-500 hover:bg-blue-600" },
  DRAFT: { text: "Borrador", className: "bg-gray-400 hover:bg-gray-500" },
  INACTIVE: { text: "Inactivo", className: "bg-orange-400 hover:bg-orange-500" },
};

export default function DuelList({ duels }: DuelListProps) {
  const { data: session } = useSession();
  const { 
    toggleDuelStatus, 
    deleteDuel, 
    resetDuelVotes, 
    getDuelStatus, 
    activateDraftDuel, 
    deleteMultipleDuels,
    activateMultipleDuels,
    deactivateMultipleDuels,
    getUserById,
  } = useAppContext();

  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);
  const [selectedDuelIds, setSelectedDuelIds] = useState<string[]>([]);
  const { toast } = useToast();

  const user = session?.user ? getUserById(session.user.id) : undefined;

  const selectedDuels = useMemo(() => {
    return duels.filter(d => selectedDuelIds.includes(d.id));
  }, [duels, selectedDuelIds]);

  const canActivateSelected = useMemo(() => {
    if (selectedDuels.length === 0 || !user) return false;
    const activatableCount = selectedDuels.filter(d => ['DRAFT', 'INACTIVE', 'CLOSED'].includes(getDuelStatus(d))).length;
    const draftCount = selectedDuels.filter(d => getDuelStatus(d) === 'DRAFT').length;
    return activatableCount > 0 && user.keys >= draftCount * 5;
  }, [selectedDuels, getDuelStatus, user]);

  const canDeactivateSelected = useMemo(() => {
    if (selectedDuels.length === 0) return false;
    return selectedDuels.some(d => ['ACTIVE', 'SCHEDULED'].includes(getDuelStatus(d)));
  }, [selectedDuels, getDuelStatus]);


  const handleRowClick = (duel: Duel) => {
    if (duel.status === 'DRAFT') return;
    setSelectedDuel(duel);
  };
  
  const handleResetVotes = (e: React.MouseEvent, duelId: string) => {
    e.stopPropagation();
    resetDuelVotes(duelId, true);
    toast({
      title: "Votos Reiniciados",
      description: `Los votos para tu duelo han sido reseteados.`,
    });
  }

  const handleActivateDuel = (e: React.MouseEvent, duelId: string) => {
     e.stopPropagation();
     if (!session?.user) return;
     const success = activateDraftDuel(duelId, session.user.id);
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
  
  const handleActivateSelected = () => {
    if (!session?.user) return;
    activateMultipleDuels(selectedDuelIds, session.user.id);
    setSelectedDuelIds([]);
     toast({
      title: "Duelos Activados",
      description: `Se han activado los duelos seleccionados.`,
    });
  }
  
  const handleDeactivateSelected = () => {
    deactivateMultipleDuels(selectedDuelIds);
    setSelectedDuelIds([]);
     toast({
      title: "Duelos Desactivados",
      description: `Se han desactivado los duelos seleccionados.`,
    });
  }

  const getTotalVotes = (duel: Duel) => duel.options.reduce((sum, option) => sum + (option.votes || 0), 0);

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
                    <Button asChild className="mt-4">
                      <Link href="/create">Crear Duelo</Link>
                    </Button>
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
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border flex-wrap gap-2">
                    <div className="text-sm font-medium">
                        {selectedDuelIds.length} duelo(s) seleccionado(s)
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleActivateSelected} disabled={!canActivateSelected}>
                            <Power className="mr-2 h-4 w-4" />
                            Activar
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDeactivateSelected} disabled={!canDeactivateSelected}>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Desactivar
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
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
              const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig] || { text: 'Desconocido', className: 'bg-yellow-400' };

              return (
                 <Card key={duel.id} className={cn("overflow-hidden", selectedDuelIds.includes(duel.id) && "border-primary")}>
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
                       <div className={cn("w-24 h-24 relative", currentStatus !== 'DRAFT' && "cursor-pointer")}>
                           <ResultsChart duel={duel} />
                           {currentStatus !== 'DRAFT' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                  <BarChart2 className="text-white h-8 w-8" />
                              </div>
                           ) : (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                <ShieldQuestion className="text-white h-8 w-8" />
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
                                {currentStatus === 'DRAFT' ? 'Pendiente' : `Cierra ${formatDistanceToNow(new Date(duel.endsAt), { locale: es, addSuffix: true })}`}
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
                      {currentStatus === 'DRAFT' ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleActivateDuel(e, duel.id)}>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                      ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleDuelStatus(duel.id); }}>
                              {currentStatus === 'ACTIVE' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                          </Button>
                      )}
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/panel/mis-duelos/${duel.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()} disabled={currentStatus === 'DRAFT'}>
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
