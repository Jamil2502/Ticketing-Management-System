require("dotenv").config({ path: ".env" });
const postgres = require("postgres");

function pad(value, width) {
    const text = String(value);
    return text.length >= width ? text : `${" ".repeat(width - text.length)}${text}`;
}

async function timed(label, fn) {
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    return { label, ms, rows: Array.isArray(result) ? result.length : 0 };
}

async function measureRun(sql, userId, eventId) {
    const eventsQuery = "SELECT id, name, date FROM events WHERE status = 'active'";

    const myEventsQuery = `
        SELECT
            e.id,
            e.name,
            e.description,
            e.date,
            e.status,
            e.created_at,
            em.role,
            em.joined_at,
            t.isvalid,
            t.id AS ticketid
        FROM events e
        JOIN event_members em ON e.id = em.eventid
        LEFT JOIN tickets t ON t.eventid = e.id AND t.userid = em.userid
        WHERE em.userid = $1
        ORDER BY e.created_at DESC
    `;
    const ticketStudentQuery = "SELECT id FROM student WHERE id = $1 LIMIT 1";
    const ticketExistingQuery = "SELECT id, isvalid FROM tickets WHERE userid = $1 AND eventid = $2 LIMIT 1";
    const ticketAfterCheckQuery = `
        WITH existing_student AS (
            SELECT id
            FROM student
            WHERE id = $1
            LIMIT 1
        ),
        existing_ticket AS (
            SELECT id, isvalid
            FROM tickets
            WHERE userid = $1 AND eventid = $2
            LIMIT 1
        )
        SELECT
            EXISTS(SELECT 1 FROM existing_student) AS student_exists,
            et.id,
            et.isvalid
        FROM existing_ticket et
        UNION ALL
        SELECT
            EXISTS(SELECT 1 FROM existing_student) AS student_exists,
            NULL::varchar AS id,
            NULL::boolean AS isvalid
        WHERE NOT EXISTS(SELECT 1 FROM existing_ticket)
        LIMIT 1
    `;

    const [events, myEvents] = await Promise.all([
        timed("/api/events", async () => sql.unsafe(eventsQuery)),
        timed("/api/events/me", async () => sql.unsafe(myEventsQuery, [userId])),
    ]);

    const ticketBefore = await timed("/api/ticket before", async () => {
        const student = await sql.unsafe(ticketStudentQuery, [userId]);
        const existing = await sql.unsafe(ticketExistingQuery, [userId, eventId]);
        return [...student, ...existing];
    });

    const ticketAfter = await timed("/api/ticket after", async () =>
        sql.unsafe(ticketAfterCheckQuery, [userId, eventId])
    );

    return {
        events,
        myEvents,
        ticketBefore,
        ticketAfter,
    };
}

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    const sql = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 1,
    });

    const users = await sql.unsafe("SELECT userid FROM event_members LIMIT 1");
    const events = await sql.unsafe("SELECT id FROM events LIMIT 1");
    if (!users[0]?.userid || !events[0]?.id) {
        throw new Error("Not enough seed data to measure API queries");
    }

    const userId = users[0].userid;
    const eventId = events[0].id;

    const warmup = await measureRun(sql, userId, eventId);
    const measured = await measureRun(sql, userId, eventId);

    console.log("Warmup (ms):");
    console.log(`- ${pad(warmup.events.label, 22)} ${pad(warmup.events.ms, 5)} ms (${warmup.events.rows} rows)`);
    console.log(`- ${pad(warmup.myEvents.label, 22)} ${pad(warmup.myEvents.ms, 5)} ms (${warmup.myEvents.rows} rows)`);
    console.log(`- ${pad(warmup.ticketBefore.label, 22)} ${pad(warmup.ticketBefore.ms, 5)} ms (${warmup.ticketBefore.rows} rows)`);
    console.log(`- ${pad(warmup.ticketAfter.label, 22)} ${pad(warmup.ticketAfter.ms, 5)} ms (${warmup.ticketAfter.rows} rows)`);

    console.log("Measured (ms):");
    console.log(`- ${pad(measured.events.label, 22)} ${pad(measured.events.ms, 5)} ms (${measured.events.rows} rows)`);
    console.log(`- ${pad(measured.myEvents.label, 22)} ${pad(measured.myEvents.ms, 5)} ms (${measured.myEvents.rows} rows)`);
    console.log(`- ${pad(measured.ticketBefore.label, 22)} ${pad(measured.ticketBefore.ms, 5)} ms (${measured.ticketBefore.rows} rows)`);
    console.log(`- ${pad(measured.ticketAfter.label, 22)} ${pad(measured.ticketAfter.ms, 5)} ms (${measured.ticketAfter.rows} rows)`);

    await sql.end();
}

main().catch((error) => {
    console.error("Performance measurement failed:", error);
    process.exit(1);
});
