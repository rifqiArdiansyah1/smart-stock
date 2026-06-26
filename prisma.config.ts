import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

/**
 * SmartStock — Prisma Configuration (v7)
 *
 * Di Prisma v7, konfigurasi datasource dipindah ke file ini.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  // @ts-ignore
  earlyAccess: true,
  studio: {
    port: 5555,
  },
  // Wajib untuk npx prisma migrate dev di v7
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
});
