import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * SmartStock — Prisma Configuration (v7)
 *
 * Di Prisma v7, konfigurasi datasource dipindah ke file ini.
 *
 * Untuk menjalankan migrate, set DATABASE_URL di .env:
 *   DATABASE_URL="postgresql://user:pass@host:5432/smartstock"
 *
 * @see https://pris.ly/d/config-datasource
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
});
