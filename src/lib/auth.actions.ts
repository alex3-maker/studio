
'use server';

import { signIn, signOut } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import { mockUsers } from './data';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

export async function login(prevState: any, formData: FormData) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
    // SignIn on success throws a NEXT_REDIRECT error, which we don't need to handle here.
    // If it fails, it will throw a different error that will be caught below.
    return { success: true, message: '¡Sesión iniciada!' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Email o contraseña incorrectos.', success: false };
        default:
          return { message: `Algo salió mal: ${error.type}.`, success: false };
      }
    }
    // This will be caught by the nearest error boundary
    throw error;
  }
}

const signupSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export async function signup(prevState: any, formData: FormData) {
    const validatedFields = signupSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return {
        message: 'Datos de registro inválidos. Por favor, revisa los errores.',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }

    const { name, email, password } = validatedFields.data;

    try {
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
            return {
                message: 'Ya existe un usuario con este email.',
                errors: { email: ['Este email ya está en uso.'] },
                success: false,
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            password: hashedPassword,
            role: 'USER',
            avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
            keys: 5,
            duelsCreated: 0,
            votesCast: 0,
            createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser as any);

    } catch (error) {
       console.error("Error creating user:", error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       return { 
         message: `Un error inesperado ocurrió al crear el usuario. Detalle: ${errorMessage}`,
         success: false 
       };
    }
    
    // If user creation was successful, attempt to sign in.
    // This is outside the try...catch because a successful signIn throws a NEXT_REDIRECT error,
    // which we want Next.js to handle by redirecting the user.
    try {
      await signIn('credentials', {
          email,
          password,
          redirectTo: '/',
      });
      return { success: true, message: '¡Registro completado!' };
    } catch (error) {
       if (error instanceof AuthError) {
          switch (error.type) {
            case 'CredentialsSignin':
              return { message: 'Error al iniciar sesión después del registro. Intenta iniciar sesión manualmente.', success: false };
            default:
              return { message: `Error de autenticación post-registro: ${error.type}.`, success: false };
          }
       }
       // Re-throw other errors (like NEXT_REDIRECT) so Next.js can handle them.
       throw error;
    }
}


export async function logout() {
  await signOut();
}
