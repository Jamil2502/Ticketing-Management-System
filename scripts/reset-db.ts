import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

async function resetDatabase() {
    console.log("Resetting database: dropping public schema...");
    await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);

    console.log("Recreating public schema...");
    await db.execute(sql`CREATE SCHEMA public`);

    console.log("Restoring public schema grants...");
    await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);

    console.log("Database reset complete.");
}

resetDatabase()
    .catch((error) => {
        console.error("Database reset failed:", error);
        process.exitCode = 1;
    })
    .finally(() => {
        process.exit();
    });
