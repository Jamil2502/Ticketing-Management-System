import { config } from "dotenv";
config();

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(client);

function generateAdminCode() {
  return crypto.randomBytes(16).toString("hex");
}

async function ensureAdminCodeColumn() {
  await db.execute(
    sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_code varchar(50)`
  );
}

async function backfillAdminCodes() {
  const existingCodesResult = await db.execute(
    sql`SELECT admin_code FROM events WHERE admin_code IS NOT NULL`
  );

  const usedCodes = new Set<string>();
  for (const row of existingCodesResult) {
    const code = row.admin_code as string | null;
    if (code) {
      usedCodes.add(code);
    }
  }

  const eventsWithoutCodeResult = await db.execute(
    sql`SELECT id FROM events WHERE admin_code IS NULL`
  );

  for (const row of eventsWithoutCodeResult) {
    const eventId = row.id as string;

    let nextCode = generateAdminCode();
    while (usedCodes.has(nextCode)) {
      nextCode = generateAdminCode();
    }

    await db.execute(
      sql`UPDATE events SET admin_code = ${nextCode} WHERE id = ${eventId}`
    );
    usedCodes.add(nextCode);
  }
}

async function enforceConstraints() {
  await db.execute(
    sql`ALTER TABLE events ALTER COLUMN admin_code SET NOT NULL`
  );
}

async function main() {
  console.log("Preparing events.admin_code...");
  await ensureAdminCodeColumn();

  console.log("Backfilling missing admin codes...");
  await backfillAdminCodes();

  console.log("Applying admin_code constraints...");
  await enforceConstraints();

  console.log("Backfill completed successfully.");
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
    process.exit();
  });
