import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.sqlite.js',
  out: './drizzle-sqlite',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/local.db'
  }
});
