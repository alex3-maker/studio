'use client';

import Link from 'next/link';
import { Flame, Key, Menu, Swords } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAppContext } from '@/context/app-context';

const navLinks = [
  { href: '/', label: 'Feed', icon: Swords },
  { href: '/create', label: 'Crear Duelo', icon: Flame },
  { href: '/panel', label: 'Panel', icon: Key },
];

export default function Header() {
  const pathname = usePathname();
  const { user } = useAppContext();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Swords className="h-6 w-6 text-primary" />
            <span className="hidden font-bold font-headline sm:inline-block">
              DuelDash
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href="/" className="mr-6 flex items-center space-x-2 mb-6">
                <Swords className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline">DuelDash</span>
              </Link>
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'transition-colors hover:text-primary',
                      pathname === link.href ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
            <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-500" />
                <span className="font-bold text-lg text-foreground/80">{user.keys}</span>
            </div>
            <Link href="/panel/perfil">
              <Avatar>
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
        </div>
      </div>
    </header>
  );
}
