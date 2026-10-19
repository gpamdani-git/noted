import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile?.();
} catch {
  // Ignore if .env is missing or already loaded
}

const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export default defineConfig(
  postgresUrl
    ? {
        schema: './src/db/schema.js',
        out: './drizzle',
        dialect: 'postgresql',
        dbCredentials: {
          url: postgresUrl
        }
      }
    : {
        schema: './src/db/schema.sqlite.js',
        out: './drizzle-sqlite',
        dialect: 'sqlite',
        dbCredentials: {
          url: './data/local.db'
        }
      }
);
