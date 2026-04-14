import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {ticketTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { ticketID, title, uid, createdAt, torf, eventId } = await req.json();

        if (!ticketID || !title|| !uid || !createdAt || !torf || !eventId) {
            return NextResponse.json({ error: "Missing fields" });
        }

        //if the ticket already exists
        const existingUser = await db.execute(
            sql`SELECT id, isvalid FROM ${ticketTable} WHERE userid = ${uid} AND eventid = ${eventId} LIMIT 1`
        );

        if (existingUser.length > 0) {
            const existingTicket = existingUser[0];
            if (existingTicket.isvalid) {
                return NextResponse.json({ message: "Existing ticket retrieved", ticketID: existingTicket.id });
            }
            return NextResponse.json({ error: "Ticket has already been used for this event" }, { status: 400 });
        }

        //inserting the new ticket
        await db.execute(
            sql`INSERT INTO ${ticketTable} (id, title, userID, eventid, createdAt, isvalid) VALUES (${ticketID}, ${title}, ${uid}, ${eventId}, ${createdAt}, ${torf})`
        );

        return NextResponse.json({ message: "Ticket added to database", ticketID: ticketID });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
