import pg from "pg";
import { config } from "./config.js";

import { Pool, type QueryResultRow } from "pg";
import { config } from "./config.js";

console.log("DB connection string preview:", config.databaseUrl.slice(0, 80));

export const pool = new Pool({
  connectionString: config.databaseUrl
});

const { Pool } = pg;
type QueryResultRow = pg.QueryResultRow;

export const pool = new Pool({
  connectionString: config.databaseUrl
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  return pool.query<T>(text, params);
}
