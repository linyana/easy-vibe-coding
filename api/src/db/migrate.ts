import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { ENV } from '../env';

const sql = postgres(ENV.DATABASE_URL, { max: 1, onnotice: () => {} });
await migrate(drizzle(sql), { migrationsFolder: 'drizzle' });
await sql.end();
console.log('✓ migrations applied');
