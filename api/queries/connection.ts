import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

const client = createClient({ url: "file:./data.sqlite" });

export const db = drizzle(client, { schema: fullSchema });

export function getDb() {
  return db;
}
