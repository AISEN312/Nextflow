import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build time, return a dummy client that will fail at runtime
    // This prevents build failures when DATABASE_URL is not set
    console.warn("DATABASE_URL not set - database operations will fail");
    return new Proxy({} as PrismaClient, {
      get: (_target, prop) => {
        if (prop === "then" || prop === "catch") return undefined;
        return new Proxy(() => {}, {
          get: () => () => Promise.reject(new Error("DATABASE_URL not configured")),
          apply: () => Promise.reject(new Error("DATABASE_URL not configured")),
        });
      },
    });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
