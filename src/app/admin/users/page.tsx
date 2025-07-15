
'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Shield, User as UserIcon, Key, Flame, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';


export default function AdminUsersPage() {
  const { getAllUsers, updateUserRole, deleteUser, adjustUserKeys, user: adminUser } = useAppContext();
  const { toast } = useToast();
  const users = getAllUsers();

  const [dialogState, setDialogState] = useState<{ open: boolean; type?: 'role' | 'delete' | 'keys'; user?: User }>({ open: false });
  const [keysAmount, setKeysAmount] = useState<number>(0);


  const openDialog = (type: 'role' | 'delete' | 'keys', user: User) => {
    setDialogState({ open: true, type, user });
    if(type === 'keys') setKeysAmount(0);
  };

  const closeDialog = () => {
    setDialogState({ open: false });
  };
  
  const handleRoleChange = () => {
    if (dialogState.user) {
      const newRole = dialogState.user.role === 'admin' ? 'user' : 'admin';
      updateUserRole(dialogState.user.id, newRole);
      toast({
        title: 'Rol Actualizado',
        description: `El rol de ${dialogState.user.name} ha sido cambiado a ${newRole}.`,
      });
      closeDialog();
    }
  };

  const handleDeleteUser = () => {
     if (dialogState.user) {
      deleteUser(dialogState.user.id);
      toast({
        title: 'Usuario Eliminado',
        description: `${dialogState.user.name} ha sido eliminado del sistema.`,
      });
      closeDialog();
    }
  }

  const handleAdjustKeys = (type: 'add' | 'remove') => {
    if (dialogState.user && keysAmount > 0) {
      const amount = type === 'add' ? keysAmount : -keysAmount;
      adjustUserKeys(dialogState.user.id, amount, `Ajuste manual por admin`);
      toast({
        title: 'Llaves Ajustadas',
        description: `Se han ${type === 'add' ? 'añadido' : 'quitado'} ${keysAmount} llaves a ${dialogState.user.name}.`,
      });
      closeDialog();
    } else if (keysAmount <= 0) {
        toast({
            variant: "destructive",
            title: "Cantidad inválida",
            description: "Por favor, introduce un número mayor que cero."
        })
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Gestionar Usuarios</CardTitle>
          <CardDescription>Visualiza, gestiona roles y elimina usuarios de la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Llaves</TableHead>
                <TableHead className="text-center">Duelos</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{`ID: ...${user.id.slice(-4)}`}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? <Shield className="mr-2 h-4 w-4" /> : <UserIcon className="mr-2 h-4 w-4" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{user.keys}</TableCell>
                  <TableCell className="text-center">{user.duelsCreated}</TableCell>
                  <TableCell>{format(new Date(user.createdAt || '2023-01-01'), "dd MMM yyyy", { locale: es })}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={user.id === adminUser.id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDialog('role', user)}>
                          {user.role === 'admin' ? <UserIcon className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
                          {user.role === 'admin' ? 'Cambiar a Usuario' : 'Cambiar a Admin'}
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => openDialog('keys', user)}>
                          <Key className="mr-2 h-4 w-4" />
                          Ajustar Llaves
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Ver Perfil</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDialog('delete', user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Usuario
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       {/* Generic Confirmation Dialog */}
      <AlertDialog open={dialogState.open && (dialogState.type === 'role' || dialogState.type === 'delete')} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.type === 'role' && `¿Cambiar el rol de ${dialogState.user?.name}?`}
              {dialogState.type === 'delete' && `¿Eliminar a ${dialogState.user?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'role' && `Esta acción cambiará los permisos del usuario en la plataforma.`}
              {dialogState.type === 'delete' && `Esta acción es permanente y no se puede deshacer. Se eliminarán los datos del usuario.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={dialogState.type === 'role' ? handleRoleChange : handleDeleteUser}>
              {dialogState.type === 'role' ? 'Confirmar Cambio' : 'Sí, Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust Keys Dialog */}
      <Dialog open={dialogState.open && dialogState.type === 'keys'} onOpenChange={closeDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Ajustar Llaves de {dialogState.user?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p>Saldo actual: <span className="font-bold">{dialogState.user?.keys}</span> <Key className="inline h-4 w-4 text-yellow-500" /></p>
              <div className="space-y-2">
                <Label htmlFor="keys-amount">Cantidad</Label>
                <Input 
                  id="keys-amount"
                  type="number"
                  value={keysAmount}
                  onChange={(e) => setKeysAmount(Number(e.target.value))}
                  placeholder="Introduce una cantidad"
                />
              </div>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => handleAdjustKeys('remove')} disabled={keysAmount <= 0 || (dialogState.user?.keys ?? 0) < keysAmount}>
                <MinusCircle className="mr-2" /> Quitar
              </Button>
              <Button onClick={() => handleAdjustKeys('add')} disabled={keysAmount <= 0}>
                <PlusCircle className="mr-2" /> Añadir
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
