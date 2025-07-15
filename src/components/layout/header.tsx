
'use client';

import Link from 'next/link';
import { Flame, Key, Menu, Swords, ShieldCheck, Bell, CheckCheck, X, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAppContext } from '@/context/app-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Notification } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';

const navLinks = [
  { href: '/', label: 'Inicio', icon: Swords },
  { href: '/create', label: 'Crear Duelo', icon: Flame },
  { href: '/panel/mis-duelos', label: 'Panel', icon: Key },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } = useAppContext();
  const unreadNotifications = notifications.filter(n => !n.read);

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  };

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
                  pathname.startsWith(link.href) && link.href !== '/' || pathname === link.href ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                {link.label}
              </Link>
            ))}
             {user.role === 'admin' && (
              <Link
                href="/admin/duels"
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center',
                  pathname.startsWith('/admin') ? 'text-foreground' : 'text-foreground/60'
                )}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir Menú</span>
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
                       pathname.startsWith(link.href) && link.href !== '/' || pathname === link.href ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                 {user.role === 'admin' && (
                    <Link
                      href="/admin/duels"
                      className={cn(
                        'transition-colors hover:text-primary flex items-center',
                        pathname.startsWith('/admin') ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      )}
                    >
                       <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin
                    </Link>
                  )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  )}
                  <span className="sr-only">Abrir notificaciones</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 md:w-96" align="end">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium leading-none">Notificaciones</h4>
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllNotificationsAsRead}>
                              <CheckCheck className="mr-1 h-3 w-3" />
                              Marcar leídas
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="link" size="sm" className="h-auto p-0 text-xs text-destructive hover:text-destructive/80">
                                  <Trash2 className="mr-1 h-3 w-3" />
                                  Limpiar
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Limpiar todas las notificaciones?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminarán todas tus notificaciones permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={clearAllNotifications}>Limpiar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                    )}
                 </div>
                 <Separator />
                 <div className="mt-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 space-y-2">
                            <Bell className="w-8 h-8" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                           <div 
                              key={n.id} 
                              className={cn(
                                "group relative block p-2 rounded-md transition-colors",
                                !n.read && "bg-secondary"
                              )}
                            >
                                <div 
                                  onClick={() => handleNotificationClick(n)}
                                  className="cursor-pointer"
                                >
                                  <p className="text-sm pr-4">{n.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                      {formatDistanceToNow(new Date(n.timestamp), { locale: es, addSuffix: true })}
                                  </p>
                                </div>
                               <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteNotification(n.id)}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Eliminar notificación</span>
                                </Button>
                           </div>
                        ))
                    )}
                 </div>
                 <Separator className="my-2"/>
                 <Button asChild variant="outline" className="w-full">
                     <Link href="/panel/notificaciones">
                        Configurar notificaciones
                    </Link>
                </Button>
              </PopoverContent>
            </Popover>

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
