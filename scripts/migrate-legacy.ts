import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eventsTable, ticketTable, usersTable } from "../src/db/schema";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
const migrationActorId = process.env.MIGRATION_ACTOR_ID;
const confirmMigration = process.env.CONFIRM_MIGRATION;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
}

if (!migrationActorId) {
    throw new Error("MIGRATION_ACTOR_ID is required");
}

if (confirmMigration !== "true") {
    throw new Error("Set CONFIRM_MIGRATION=true to run this script");
}

const LEGACY_EVENT_ID = "legacy-single-event";
const TEST_EVENT_DRAFT_ID = "test-event-draft";
const TEST_EVENT_ACTIVE_ID = "test-event-active";

const client = postgres(databaseUrl, { ssl: "require" });
const db = drizzle(client);

type Executor = {
    execute: typeof db.execute;
};

async function ensureActorExists(executor: Executor) {
    const actor = await executor.execute(
        sql`SELECT id FROM ${usersTable} WHERE id = ${migrationActorId} LIMIT 1`
    );

    if (actor.length === 0) {
        throw new Error("MIGRATION_ACTOR_ID does not exist in users table");
    }
}

async function insertEventIfMissing(
    executor: Executor,
    eventId: string,
    name: string,
    description: string,
    status: string,
    date: string,
    createdAt: string
) {
    const existingEvent = await executor.execute(
        sql`SELECT id FROM ${eventsTable} WHERE id = ${eventId} LIMIT 1`
    );

    if (existingEvent.length > 0) {
        return;
    }

    await executor.execute(
        sql`INSERT INTO ${eventsTable} (id, name, description, date, status, created_by, created_at)
            VALUES (${eventId}, ${name}, ${description}, ${date}, ${status}, ${migrationActorId}, ${createdAt})`
    );
}

async function backfillLegacyEventId(executor: Executor) {
    await executor.execute(
        sql`UPDATE ${ticketTable} SET eventid = ${LEGACY_EVENT_ID} WHERE eventid IS NULL`
    );
}

async function runMigration() {
    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
        await ensureActorExists(tx);
        console.log("Step complete: migration actor verified.");

        await insertEventIfMissing(
            tx,
            LEGACY_EVENT_ID,
            "Legacy Event",
            "System-generated event for pre-migration tickets",
            "active",
            nowIso,
            nowIso
        );
        console.log("Step complete: legacy event ensured.");

        await backfillLegacyEventId(tx);
        console.log("Step complete: ticket.eventid backfilled for legacy rows.");

        await insertEventIfMissing(
            tx,
            TEST_EVENT_DRAFT_ID,
            "Test Draft Event",
            "Seeded draft event for local/testing flows",
            "draft",
            nowIso,
            nowIso
        );
        console.log("Step complete: test draft event ensured.");

        await insertEventIfMissing(
            tx,
            TEST_EVENT_ACTIVE_ID,
            "Test Active Event",
            "Seeded active event for local/testing flows",
            "active",
            nowIso,
            nowIso
        );
        console.log("Step complete: test active event ensured.");
    });

    console.log("Migration complete: legacy backfill + test events seeded.");
}

runMigration()
    .catch((error) => {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await client.end();
    });
