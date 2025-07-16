
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
    return { success: true, message: '¡Sesión iniciada!' };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Email o contraseña incorrectos.', success: false };
        default:
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
    try {
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

        // En una app real, esto consultaría la base de datos
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
            return {
                message: 'Ya existe un usuario con este email. Por favor, inicia sesión.',
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

        await signIn('credentials', {
            email,
            password,
            redirectTo: '/',
        });

        return { success: true, message: '¡Registro completado!' };
    } catch (error) {
        if (error instanceof AuthError) {
            if (error.type === 'CredentialsSignin') {
                return { message: 'No se pudo iniciar sesión después del registro. Credenciales inválidas.', success: false };
            }
             return { message: `Error de autenticación: ${error.type}.`, success: false };
        }
        console.error("Error inesperado en signup:", error);
        return { message: `Un error inesperado ocurrió. Por favor, inténtalo de nuevo.`, success: false };
    }
}


export async function logout() {
  await signOut();
}
