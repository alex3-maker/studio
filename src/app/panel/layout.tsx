
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Grip } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const panelNavLinks = [
  { href: '/panel/mis-duelos', label: 'Mis Duelos', icon: Grip },
  { href: '/panel/perfil', label: 'Perfil', icon: User },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col md:flex-row gap-8">
         <aside className="w-full md:w-1/4 lg:w-1/5">
          <h2 className="text-2xl font-headline mb-4">Panel</h2>
          <nav className="flex flex-col space-y-2">
            {panelNavLinks.map((link) => (
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
