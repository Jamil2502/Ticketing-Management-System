import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {eventsTable, ticketTable} from "@/db/schema";

const LEGACY_EVENT_ID = "legacy-single-event";

export async function POST(req: Request) {
    try {
        const { ticketID, title, uid, createdAt, torf, eventId } = await req.json();
        let resolvedEventId: string | null = eventId || null;

        if (!ticketID || !title|| !uid || !createdAt || !torf) {
            return NextResponse.json({ error: "Missing fields" });
        }

        if (!eventId) {
            console.warn(`[MIGRATION WARNING] /api/ticket fallback to legacy event for user ${uid}`);

            const legacyEvent = await db.execute(
                sql`SELECT id FROM ${eventsTable} WHERE id = ${LEGACY_EVENT_ID} LIMIT 1`
            );

            if (legacyEvent.length > 0) {
                resolvedEventId = LEGACY_EVENT_ID;
            } else {
                console.warn("[MIGRATION WARNING] Legacy event missing; creating ticket with NULL eventid");
            }
        }

        //if the ticket already exists
        const existingUser = resolvedEventId
            ? await db.execute(
                sql`SELECT id FROM ${ticketTable} WHERE id = ${ticketID} AND eventid = ${resolvedEventId} LIMIT 1`
            )
            : await db.execute(
                sql`SELECT id FROM ${ticketTable} WHERE id = ${ticketID} AND eventid IS NULL LIMIT 1`
            );

        if (existingUser.length > 0) {
            return NextResponse.json({ message: "Ticket already exists" });
        }

        //inserting the new ticket
        if (resolvedEventId) {
            await db.execute(
                sql`INSERT INTO ${ticketTable} (id, title, userID, eventid, createdAt, isvalid) VALUES (${ticketID}, ${title}, ${uid}, ${resolvedEventId}, ${createdAt}, ${torf})`
            );
        } else {
            await db.execute(
                sql`INSERT INTO ${ticketTable} (id, title, userID, createdAt, isvalid) VALUES (${ticketID}, ${title}, ${uid}, ${createdAt}, ${torf})`
            );
        }

        return NextResponse.json({ message: "Ticket added to database" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
