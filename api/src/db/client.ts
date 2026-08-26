import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV } from '../env';
import * as schema from './schema';

export const pool = postgres(ENV.DATABASE_URL);
export const db = drizzle(pool, { schema });
