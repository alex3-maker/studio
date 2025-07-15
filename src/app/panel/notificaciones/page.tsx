
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const notificationSettings = [
  { id: 'duel-closed', label: 'Cuando un duelo en el que voté finaliza', description: 'Recibe una notificación para que puedas ver los resultados finales.' },
  { id: 'duel-edited', label: 'Cuando un duelo en el que voté es modificado', description: 'Entérate si el creador cambia el título, la descripción o las opciones.' },
  { id: 'duel-reset', label: 'Cuando se reinician los votos de un duelo', description: 'Si el creador resetea una votación en la que participaste, te lo haremos saber.' },
  { id: 'duel-winner-change', label: 'Cuando cambia el ganador de un duelo activo', description: 'Sigue la emoción y entérate en tiempo real si hay un nuevo líder.' },
];

export default function NotificacionesPage() {
  // En una app real, el estado de estos switches se guardaría en el backend.
  // Por ahora, su estado es solo visual.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Ajustes de Notificaciones</CardTitle>
        <CardDescription>
          Elige qué notificaciones quieres recibir para mantenerte al día con los duelos que te importan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notificaciones de Duelos</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona las alertas relacionadas con los duelos en los que participas.
          </p>
        </div>
        <Separator />
        <ul className="space-y-4">
            {notificationSettings.map((setting) => (
               <li key={setting.id} className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor={setting.id} className="text-base">{setting.label}</Label>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch id={setting.id} defaultChecked />
               </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
