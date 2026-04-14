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

    await sql.unsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'tickets_userid_eventid_unique'
            ) THEN
                ALTER TABLE tickets
                ADD CONSTRAINT tickets_userid_eventid_unique UNIQUE (userid, eventid);
            END IF;
        END
        $$;
    `);

    const rows = await sql.unsafe(`
        SELECT conname, pg_get_constraintdef(c.oid) AS definition
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'tickets'
          AND conname = 'tickets_userid_eventid_unique'
        LIMIT 1
    `);

    if (!rows[0]) {
        throw new Error("Failed to verify tickets_userid_eventid_unique constraint");
    }

    console.log(`Constraint present: ${rows[0].conname} -> ${rows[0].definition}`);
    await sql.end();
}

main().catch((error) => {
    console.error("Failed to ensure ticket uniqueness constraint:", error);
    process.exit(1);
});
