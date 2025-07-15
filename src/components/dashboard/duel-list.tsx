import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Duel } from "@/lib/types";
import ResultsChart from "./results-chart";

interface DuelListProps {
  duels: Duel[];
}

export default function DuelList({ duels }: DuelListProps) {
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
              <TableHead className="text-right w-1/4">Resultados</TableHead>
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
                    <div className="h-12 w-full flex justify-end">
                      <div className="w-12">
                        <ResultsChart duel={duel} />
                      </div>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Content>
    </Card>
  );
}
