import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

// Initialize the Turso (LibSQL) client
const tursoClient = createClient({
  url: process.env.DATABASE_URL as string, // Turso connection string
  authToken: process.env.AUTH_TOKEN as string,
});

// Use the LibSQL adapter
const adapter = new PrismaLibSQL(tursoClient);

// Workaround for PrismaClient to accept the 'adapter' property
const prisma = new (PrismaClient as unknown as new (options: any) => PrismaClient)({
  adapter, // Add the LibSQL adapter
});

export default prisma;
