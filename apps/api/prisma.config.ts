// apps/api/prisma.config.ts
import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // IMPORTANT: Use DIRECT_URL for migrations (no pooler)
    url: process.env.DIRECT_URL,
  },
});
