'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

export default function PerfilPage() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const handleSaveChanges = () => {
    toast({
      title: "Perfil Actualizado",
      description: "Tus cambios han sido guardados (no realmente, esto es una demo).",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión correctamente. Redirigiendo...",
    });
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Perfil y Ajustes</CardTitle>
        <CardDescription>Gestiona los detalles de tu cuenta y preferencias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="outline">Cambiar Avatar</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={`${user.name.toLowerCase().replace(' ', '.')}@duel-dash.com`} disabled />
          </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña Actual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <Input id="new-password" type="password" />
          </div>
        <div>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
        <Separator />
         <div>
          <Button variant="destructive" onClick={handleLogout}>Cerrar Sesión</Button>
        </div>
      </CardContent>
    </Card>
  );
}
