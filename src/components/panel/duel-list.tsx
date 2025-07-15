
'use client';

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit } from "lucide-react";
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
import { Separator } from "../ui/separator";

interface DuelListProps {
  duels: Duel[];
}

export default function DuelList({ duels }: DuelListProps) {
  const { toggleDuelStatus, deleteDuel } = useAppContext();
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);

  const handleRowClick = (duel: Duel) => {
    setSelectedDuel(duel);
  };

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
          {duels.map((duel) => (
             <div
                key={duel.id}
                onClick={() => handleRowClick(duel)}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {/* Chart & Status */}
                <div className="flex-shrink-0 w-20 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-16 md:h-16">
                    <ResultsChart duel={duel} />
                  </div>
                  <Badge variant={duel.status === 'active' ? 'default' : 'secondary'} className="w-fit">
                    {duel.status === 'active' ? 'Activo' : 'Cerrado'}
                  </Badge>
                </div>

                <Separator orientation="vertical" className="hidden md:block h-16" />

                {/* Title & Meta */}
                <div className="flex-grow">
                  <p className="font-bold text-lg">{duel.title}</p>
                   <p className="text-xs text-muted-foreground font-mono mt-1">
                    ID: {duel.id}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-start md:justify-end space-x-2 w-full md:w-auto border-t md:border-none pt-4 md:pt-0 mt-4 md:mt-0">
                  <Button asChild variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/panel/mis-duelos/${duel.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar Duelo</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleDuelStatus(duel.id); }}>
                    {duel.status === 'active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                    <span className="sr-only">{duel.status === 'active' ? 'Cerrar Duelo' : 'Activar Duelo'}</span>
                  </Button>
                  <AlertDialog onOpenChange={(open) => !open && e.stopPropagation()}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Eliminar Duelo</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente tu duelo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteDuel(duel.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
          ))}
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
