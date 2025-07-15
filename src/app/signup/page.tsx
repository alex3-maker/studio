'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = () => {
     toast({
      title: "¡Cuenta Creada!",
      description: "¡Bienvenido! Estamos iniciando tu sesión...",
    });
    // En una app real, aquí se gestionaría la creación de usuario y el estado de autenticación.
    // Para esta demo, solo redirigimos.
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline">Crear una Cuenta</CardTitle>
          <CardDescription>Introduce tus datos para empezar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
           <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Alex Doe" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@ejemplo.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={handleSignUp}>Registrarse</Button>
           <p className="mt-4 text-xs text-center text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
