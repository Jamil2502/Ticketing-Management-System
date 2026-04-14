import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentTable, ticketTable } from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { ticketId, ticketID, title, uid, createdAt, torf, eventId } = await req.json();
        const resolvedTicketId = ticketId ?? ticketID;

        if (!resolvedTicketId || !title|| !uid || !createdAt || !torf || !eventId) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        const existingData = await db.execute(sql`
            WITH existing_student AS (
                SELECT id
                FROM ${studentTable}
                WHERE id = ${uid}
                LIMIT 1
            ),
            existing_ticket AS (
                SELECT id, isvalid
                FROM ${ticketTable}
                WHERE userid = ${uid} AND eventid = ${eventId}
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
        `);

        const existingRows = existingData as unknown as { student_exists: boolean; id: string | null; isvalid: boolean | null }[];
        const existingRecord = existingRows[0];

        if (!existingRecord?.student_exists) {
            return NextResponse.json({ success: false, error: "Student profile not found" }, { status: 400 });
        }

        if (existingRecord?.id) {
            const existingTicket = { id: existingRecord.id, isvalid: existingRecord.isvalid };
            if (existingTicket.isvalid) {
                return NextResponse.json({ success: true, data: { message: "Existing ticket retrieved", ticketId: existingTicket.id }, message: "Existing ticket retrieved", ticketId: existingTicket.id });
            }
            return NextResponse.json({ success: false, error: "Ticket has already been used for this event" }, { status: 400 });
        }

        //inserting the new ticket
        const createdTicket = await db.execute(sql`
            WITH inserted AS (
                INSERT INTO ${ticketTable} (id, userid, eventid, title, createdAt, isvalid)
                VALUES (${resolvedTicketId}, ${uid}, ${eventId}, ${title}, ${createdAt}, ${torf})
                ON CONFLICT (userid, eventid) DO NOTHING
                RETURNING id
            )
            SELECT id FROM inserted
            UNION ALL
            SELECT id
            FROM ${ticketTable}
            WHERE userid = ${uid} AND eventid = ${eventId}
            LIMIT 1
        `);
        const createdRows = createdTicket as unknown as { id: string }[];
        const finalTicketId = createdRows[0]?.id ?? resolvedTicketId;

        const joinedAt = new Date().toISOString();
        await db.execute(sql`
            INSERT INTO event_members (userid, eventid, role, joined_at)
            VALUES (${uid}, ${eventId}, 'member', ${joinedAt})
            ON CONFLICT (eventid, userid) DO NOTHING
        `);

        return NextResponse.json({ success: true, data: { message: "Ticket added to database", ticketId: finalTicketId }, message: "Ticket added to database", ticketId: finalTicketId });

    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
