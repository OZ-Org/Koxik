import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/base/db/schemas.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  },
  // Print all statements
  verbose: true,
  // Always ask for confirmation
  strict: true,
});
