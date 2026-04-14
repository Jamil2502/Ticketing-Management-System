require("dotenv").config({ path: ".env" });
const postgres = require("postgres");

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    const sql = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 1,
    });

    const indexStatements = [
        "CREATE INDEX IF NOT EXISTS event_members_userid_idx ON event_members (userid)",
        "CREATE INDEX IF NOT EXISTS event_members_eventid_idx ON event_members (eventid)",
        "CREATE INDEX IF NOT EXISTS tickets_userid_idx ON tickets (userid)",
        "CREATE INDEX IF NOT EXISTS tickets_eventid_idx ON tickets (eventid)",
        "CREATE INDEX IF NOT EXISTS events_created_by_idx ON events (created_by)",
        "DROP INDEX IF EXISTS event_members_eventid_userid_idx",
    ];

    for (const statement of indexStatements) {
        await sql.unsafe(statement);
    }

    const createdIndexes = await sql.unsafe(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname IN (
              'event_members_userid_idx',
              'event_members_eventid_idx',
              'tickets_userid_idx',
              'tickets_eventid_idx',
              'events_created_by_idx'
          )
        ORDER BY indexname
    `);

    console.log("Indexes present:");
    for (const idx of createdIndexes) {
        console.log(`- ${idx.indexname}: ${idx.indexdef}`);
    }

    await sql.end();
}

main().catch((error) => {
    console.error("Failed to create indexes:", error);
    process.exit(1);
});
