import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// The canonical list of public emergency numbers. Editing this file and
// re-running `npm run db:seed` is the way to change what the API serves.
const numbers = [
  { name: "Police", number: "112", category: "security" },
  { name: "Ambulance / SAMU", number: "912", category: "medical" },
  { name: "Fire Brigade", number: "112", category: "fire" },
  { name: "Gender-Based Violence", number: "3512", category: "social" },
];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to apps/api/.env");
  process.exit(1);
}

const sql = neon(connectionString);

// Neon's serverless HTTP endpoint can transiently time out; retry with backoff.
async function withRetry(fn, attempts = 6) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}

async function main() {
  // Create the table if it doesn't exist yet (keeps this runnable without an
  // interactive `drizzle-kit push`).
  await withRetry(
    () => sql`
      CREATE TABLE IF NOT EXISTS emergency_numbers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL UNIQUE,
        number varchar(30) NOT NULL,
        category varchar(60) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `,
  );

  for (const n of numbers) {
    await withRetry(
      () => sql`
        INSERT INTO emergency_numbers (name, number, category)
        VALUES (${n.name}, ${n.number}, ${n.category})
        ON CONFLICT (name)
        DO UPDATE SET number = EXCLUDED.number, category = EXCLUDED.category
      `,
    );
  }

  const rows = await withRetry(
    () => sql`SELECT name, number, category FROM emergency_numbers ORDER BY category, name`,
  );

  console.log(`Seeded ${rows.length} emergency numbers:`);
  for (const r of rows) console.log(`  - [${r.category}] ${r.name}: ${r.number}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
