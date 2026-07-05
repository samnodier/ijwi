import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/db/schema.js";

async function main() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  // Neon's serverless HTTP driver does not support connection pooler hosts (ending in -pooler).
  // We rewrite the URL to use the direct (non-pooled) host for HTTP access.
  if (connectionString.includes("-pooler")) {
    console.log("Rewriting pooled connection string to non-pooled for HTTP driver...");
    connectionString = connectionString.replace("-pooler", "");
  }

  console.log("Connecting to the database to wipe test data...");
  try {
    const sql = neon(connectionString);
    const db = drizzle(sql, { schema });

    // Wipe tables
    await db.delete(schema.media);
    console.log("Wiped all records from the media table.");

    await db.delete(schema.posts);
    console.log("Wiped all records from the posts (reports) table.");

    console.log("\nDatabase test data successfully wiped out! You can now start with fresh real images.");
  } catch (err) {
    console.error("Failed to wipe database:", err);
    process.exit(1);
  }
}

main();
