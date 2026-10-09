import { PGlite, type Transaction } from "@electric-sql/pglite";
import { migrate } from "./migrate";
import { seed } from "./seed";

export type DB = PGlite;
export type Queryable = PGlite | Transaction;

/** Creates a PGlite database. Omit `dataDir` for an in-memory instance. */
export async function createDb(dataDir?: string): Promise<DB> {
  const db = dataDir ? new PGlite(dataDir) : new PGlite();
  await migrate(db);
  await seed(db);
  return db;
}
