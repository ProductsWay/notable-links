import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

const auth = {
  url: process.env.TURSO_DB_URL ?? "file:./local.db",
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
};

const client = createClient(auth);
export const db = drizzle(client, { schema });