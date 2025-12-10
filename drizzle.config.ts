import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/core/base/db/schemas.ts',

  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true,
});
