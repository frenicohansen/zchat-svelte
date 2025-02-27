import { env } from '$env/dynamic/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { schema } from '../../db/schema'

const { Pool } = pg
const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

export const db = drizzle({ client: pool, schema })
