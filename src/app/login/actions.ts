'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Email atau password salah.';
        default:
          return 'Terjadi kesalahan saat login.';
      }
    }
    // Jika auth error mengandung pesan dari rate limiter
    if (error instanceof Error && error.message.includes('Akun terkunci')) {
      return error.message;
    }
    
    // Auth.js melemparkan redirect error yang harus di-rethrow
    throw error;
  }
}
