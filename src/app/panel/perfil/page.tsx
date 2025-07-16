
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
      title: "Perfil Actualizado",
      description: "Tus cambios han sido guardados (no realmente, esto es una demo).",
    });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
    toast({
      title: "Sesión Cerrada",
      description: "Has cerrado sesión correctamente.",
    });
  };

  if (status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
          <Separator />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }
  
  if (!session?.user) {
    return null;
  }
  
  const { user } = session;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Perfil y Ajustes</CardTitle>
        <CardDescription>Gestiona los detalles de tu cuenta y preferencias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <Button variant="outline">Cambiar Avatar</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue={user.name || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={user.email || ''} disabled />
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
