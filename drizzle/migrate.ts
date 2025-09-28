import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import logger from "../server/logger";

const auth = {
  url: process.env.TURSO_DB_URL ?? "file:./local.db",
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
};

logger.info(`Connecting to db: ${auth.url}`);
const client = createClient(auth);

const db = drizzle(client);

logger.info("Migrating tables...");
await migrate(db, {
  migrationsFolder: `${import.meta.dir}/migrations`,
});

logger.info("Tables migrated!");
