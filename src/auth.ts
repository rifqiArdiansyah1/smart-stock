import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';
import redis from '@/lib/redis';

async function incrementFailedAttempts(attemptsKey: string, lockKey: string) {
  const attempts = await redis.incr(attemptsKey);
  // Set expire 15 menit jika baru dibuat
  if (attempts === 1) {
    await redis.expire(attemptsKey, 15 * 60);
  }
  
  if (attempts >= 5) {
    // Kunci selama 15 menit
    await redis.setex(lockKey, 15 * 60, "locked");
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        
        // 1. Rate Limiting Check via Upstash Redis
        const attemptsKey = `login_attempts:${email}`;
        const lockKey = `login_lock:${email}`;
        
        const isLocked = await redis.get(lockKey);
        if (isLocked) {
          throw new Error("Akun terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam 15 menit.");
        }

        // 2. Cari User di DB PostgreSQL
        const user = await db.user.findUnique({
          where: { email }
        });

        if (!user) {
          await incrementFailedAttempts(attemptsKey, lockKey);
          throw new Error("Email atau password salah.");
        }

        // 3. Verifikasi Password dengan bcrypt
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          await incrementFailedAttempts(attemptsKey, lockKey);
          throw new Error("Email atau password salah.");
        }

        // 4. Berhasil login, reset failed attempts
        await redis.del(attemptsKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      }
    })
  ],
});
