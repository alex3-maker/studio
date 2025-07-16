
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
    const validatedFields = loginSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return {
        message: 'Datos inválidos.',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }
    
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
    const validatedFields = signupSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return {
        message: 'Datos inválidos.',
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      };
    }

    const { name, email, password } = validatedFields.data;

    // En una app real, esto consultaría la base de datos
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
        return {
            message: 'Ya existe un usuario con este email.',
            success: false,
        }
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // En una app real, esto crearía el usuario en la BD.
    // Aquí, lo añadimos al array de mockUsers (simulación)
    const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: hashedPassword, // Guardamos la contraseña hasheada
        role: 'USER',
        avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
        keys: 5, // Llaves iniciales
        duelsCreated: 0,
        votesCast: 0,
        createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser as any);

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: '/',
        });
        return { success: true, message: '¡Registro completado!' };
    } catch (error) {
        if (error instanceof AuthError) {
            return { message: 'No se pudo iniciar sesión después del registro.', success: false };
        }
        throw error;
    }
}


export async function logout() {
  await signOut();
}
