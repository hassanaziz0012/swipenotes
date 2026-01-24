import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/models/*',
  dialect: 'sqlite',
  driver: 'expo',
});
