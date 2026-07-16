import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prismaClient = global.prisma ?? createPrismaClient();

if (prismaClient && process.env.NODE_ENV !== "production") {
  global.prisma = prismaClient;
}

const prisma = prismaClient ?? new Proxy({} as PrismaClient, {
  get(_target, property) {
    throw new Error(`DATABASE_URL belum di-set. Prisma client tidak dapat digunakan untuk ${String(property)}.`);
  }
});

export default prisma;
