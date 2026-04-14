import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {ticketTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { ticketId, ticketID, title, uid, createdAt, torf, eventId } = await req.json();
        const resolvedTicketId = ticketId ?? ticketID;

        if (!resolvedTicketId || !title|| !uid || !createdAt || !torf || !eventId) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        //if the ticket already exists
        const existingUser = await db.execute(
            sql`SELECT id, isvalid FROM ${ticketTable} WHERE userid = ${uid} AND eventid = ${eventId} LIMIT 1`
        );

        const existingRows = (existingUser as unknown as { rows: { id: string; isvalid: boolean | null }[] }).rows;

        if (existingRows.length > 0) {
            const existingTicket = existingRows[0];
            if (existingTicket.isvalid) {
                return NextResponse.json({ success: true, data: { message: "Existing ticket retrieved", ticketId: existingTicket.id }, message: "Existing ticket retrieved", ticketId: existingTicket.id });
            }
            return NextResponse.json({ success: false, error: "Ticket has already been used for this event" }, { status: 400 });
        }

        //inserting the new ticket
        await db.execute(
            sql`INSERT INTO ${ticketTable} (id, userid, eventid, title, createdAt, isvalid) VALUES (${resolvedTicketId}, ${uid}, ${eventId}, ${title}, ${createdAt}, ${torf})`
        );

        const joinedAt = new Date().toISOString();
        await db.execute(sql`
            INSERT INTO event_members (userid, eventid, role, joined_at)
            VALUES (${uid}, ${eventId}, 'member', ${joinedAt})
            ON CONFLICT (eventid, userid) DO NOTHING
        `);

        return NextResponse.json({ success: true, data: { message: "Ticket added to database", ticketId: resolvedTicketId }, message: "Ticket added to database", ticketId: resolvedTicketId });

    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
