import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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


interface DuelListProps {
  duels: Duel[];
}

export default function DuelList({ duels }: DuelListProps) {
  const { toggleDuelStatus, deleteDuel } = useAppContext();

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
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Mis Duelos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-1/4">Resultados</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duels.map((duel) => (
              <TableRow key={duel.id}>
                <TableCell className="font-medium">{duel.title}</TableCell>
                <TableCell>
                  <Badge variant={duel.status === 'active' ? 'default' : 'secondary'}>
                    {duel.status === 'active' ? 'Activo' : 'Cerrado'}
                  </Badge>
                </TableCell>
                <TableCell>
                    <div className="h-12 w-full flex justify-start">
                      <div className="w-12">
                        <ResultsChart duel={duel} />
                      </div>
                    </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                   <Button asChild variant="ghost" size="icon">
                    <Link href={`/panel/mis-duelos/${duel.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar Duelo</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleDuelStatus(duel.id)}>
                    {duel.status === 'active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                     <span className="sr-only">{duel.status === 'active' ? 'Cerrar Duelo' : 'Activar Duelo'}</span>
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="ghost" size="icon">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}