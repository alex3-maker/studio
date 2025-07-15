import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Duel } from "@/lib/types";
import ResultsChart from "./results-chart";

interface DuelListProps {
  duels: Duel[];
}

export default function DuelList({ duels }: DuelListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">My Duels</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-1/4">Results</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duels.map((duel) => (
              <TableRow key={duel.id}>
                <TableCell className="font-medium">{duel.title}</TableCell>
                <TableCell>
                  <Badge variant={duel.status === 'active' ? 'default' : 'secondary'}>
                    {duel.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="h-12 w-12 mx-auto">
                        <ResultsChart duel={duel} />
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
