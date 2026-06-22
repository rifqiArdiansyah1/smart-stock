/**
 * SmartStock — Database Client (Prisma)
 *
 * Singleton Prisma client untuk mencegah multiple instances
 * saat hot-reload di development (Next.js).
 *
 * TODO (ISSUE-002): Install Prisma dan ganti placeholder ini:
 *   npm install prisma @prisma/client
 *   npx prisma init
 *
 * @see https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

// Placeholder type — akan diganti dengan PrismaClient setelah ISSUE-002
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbClient = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: DbClient = null;

export default db;
