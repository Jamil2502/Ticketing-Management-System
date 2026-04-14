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
            sql`SELECT id FROM ${ticketTable} WHERE id = ${ticketID} AND eventid = ${eventId} LIMIT 1`
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ message: "Ticket already exists" });
        }

        //inserting the new ticket
        await db.execute(
            sql`INSERT INTO ${ticketTable} (id, title, userID, eventid, createdAt, isvalid) VALUES (${ticketID}, ${title}, ${uid}, ${eventId}, ${createdAt}, ${torf})`
        );

        return NextResponse.json({ message: "Ticket added to database" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
