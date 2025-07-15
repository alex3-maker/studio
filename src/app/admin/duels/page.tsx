
'use client';

import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Power, PowerOff, Edit } from "lucide-react";
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

export default function AdminDuelsPage() {
  const { duels, toggleDuelStatus, deleteDuel } = useAppContext();
  const [selectedDuel, setSelectedDuel] = useState<Duel | null>(null);

  const handleRowClick = (duel: Duel) => {
    if (duel.status === 'closed') {
      setSelectedDuel(duel);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Gestionar Duelos</CardTitle>
          <CardDescription>Visualiza, activa, cierra, edita y elimina duelos de todos los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Título</TableHead>
                <TableHead>Creador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duels.map((duel) => (
                <TableRow 
                  key={duel.id} 
                  onClick={() => handleRowClick(duel)}
                  className={duel.status === 'closed' ? 'cursor-pointer' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{duel.title}</span>
                      <span className="text-xs text-muted-foreground">{duel.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{duel.creator.name}</TableCell>
                  <TableCell>
                    <Badge variant={duel.status === 'active' ? 'default' : 'secondary'}>
                      {duel.status === 'active' ? 'Activo' : 'Cerrado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10">
                      {duel.status === 'closed' && <ResultsChart duel={duel} />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/admin/duels/${duel.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Duelo</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleDuelStatus(duel.id); }}>
                      {duel.status === 'active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                      <span className="sr-only">{duel.status === 'active' ? 'Cerrar Duelo' : 'Activar Duelo'}</span>
                    </Button>
                    <AlertDialog onOpenChange={(open) => !open && setSelectedDuel(null)}>
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
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el duelo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDuel(duel.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {duels.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No hay duelos para mostrar.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
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
