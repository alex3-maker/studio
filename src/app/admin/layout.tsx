
'use client';

import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Swords, Users } from 'lucide-react';

const adminNavLinks = [
  { href: '/admin/duels', label: 'Gestionar Duelos', icon: Swords },
  { href: '/admin/users', label: 'Gestionar Usuarios', icon: Users },
  { href: '/admin/settings', label: 'Ajustes de IA', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAppContext();
  const pathname = usePathname();

  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                    Acceso Denegado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>No tienes permisos para acceder a esta sección.</p>
                <Button asChild className="mt-4">
                    <Link href="/">Volver al inicio</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row gap-8">
         <aside className="w-full md:w-1/4 lg:w-1/5">
          <h2 className="text-2xl font-headline mb-4">Panel de Admin</h2>
          <nav className="flex flex-col space-y-2">
            {adminNavLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={pathname === link.href ? 'default' : 'ghost'}
                className="justify-start"
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
