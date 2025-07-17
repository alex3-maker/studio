
'use server';

import { signIn, signOut } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

export async function login(prevState: any, formData: FormData) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
    return { success: true, message: '¡Sesión iniciada!' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Email o contraseña incorrectos.', success: false };
        default:
          console.error('Auth Error:', error);
          return { message: 'Algo salió mal. Por favor, inténtalo de nuevo.', success: false };
      }
    }
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
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return {
                message: 'Ya existe un usuario con este email.',
                errors: { email: ['Este email ya está en uso.'] },
                success: false,
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
                role: 'USER',
                keys: 5,
            }
        });

    } catch (error) {
       console.error("Error creating user in DB:", error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       return { 
         message: `Un error inesperado ocurrió al crear el usuario. Detalle: ${errorMessage}`,
         success: false 
       };
    }
    
    // After successful creation, try to sign in
    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/',
        });
        // This part is unlikely to be reached if signIn is successful, as it redirects.
        return { success: true, message: '¡Registro completado!' };
    } catch (error) {
        if (error instanceof AuthError) {
            console.error('Error signing in after signup:', error);
            // Even if sign-in fails, registration was successful.
            // The user can now log in manually.
            return { success: true, message: '¡Registro completado! Ahora puedes iniciar sesión.' };
        }
        console.error('Unexpected error during signIn after signup:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            message: `El registro fue exitoso, pero ocurrió un error al iniciar sesión automáticamente. Detalle: ${errorMessage}`,
        };
    }
}


export async function logout() {
  await signOut();
}
