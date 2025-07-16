
'use server';

import { signIn, signOut } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña no puede estar vacía.' }),
});

export async function login(prevState: any, formData: FormData) {
  try {
    // Esto llamará al `authorize` de NextAuth y manejará la redirección
    await signIn('credentials', Object.fromEntries(formData));
    // La redirección es manejada por NextAuth, por lo que no es necesario devolver un estado aquí.
    // Si llegamos aquí, es un caso inesperado.
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
    // Si no es un AuthError, relánzalo para que Next.js lo maneje.
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
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}`;

    try {
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existingUser) {
            return {
                message: 'Ya existe un usuario con este email.',
                errors: { email: ['Este email ya está en uso.'] },
                success: false,
            }
        }

        await db.insert(users).values({
            id: userId,
            name,
            email,
            password: hashedPassword,
            image: `https://i.pravatar.cc/150?u=${email}`,
            role: 'USER',
            keys: 5,
        });

    } catch (error) {
       console.error("Error creating user in DB:", error);
       const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
       return { 
         message: `Un error inesperado ocurrió al crear el usuario. Detalle: ${errorMessage}`,
         success: false 
       };
    }
    
    // Devolvemos éxito, y el cliente se encargará de llamar a signIn
    return { 
        success: true, 
        message: '¡Registro completado!',
    };
}


export async function logout() {
  await signOut();
}
