import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Notificaciones</CardTitle>
        <CardDescription>Aquí verás las actualizaciones de tus duelos y otras alertas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 space-y-4">
            <Bell className="w-16 h-16" />
            <p className="text-lg">No tienes notificaciones nuevas</p>
            <p className="text-sm">Cuando los resultados de un duelo estén listos o ganes un sorteo, te avisaremos aquí.</p>
        </div>
      </CardContent>
    </Card>
  );
}
