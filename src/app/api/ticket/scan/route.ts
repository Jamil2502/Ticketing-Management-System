import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ticketTable } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { ticketId, eventId } = await req.json();

        if (!ticketId || !eventId) {
            return NextResponse.json({ error: "Missing ticketId or eventId" }, { status: 400 });
        }

        const authCheck = await db.execute(
            sql`SELECT role FROM event_members
                WHERE eventid = ${eventId} AND userid = ${userId}
                AND role IN ('creator', 'admin')
                LIMIT 1`
        );

        const authRows = (authCheck as unknown as { rows: { role: string }[] }).rows;

        if (authRows.length === 0) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const existingTicket = await db.execute(
            sql`SELECT id, isvalid FROM ${ticketTable} WHERE id = ${ticketId} AND eventid = ${eventId} LIMIT 1`
        );

        const ticketRows = (existingTicket as unknown as { rows: { id: string; isvalid: boolean | null }[] }).rows;

        if (ticketRows.length === 0) {
            return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
        }

        const ticket = ticketRows[0];

        if (!ticket.isvalid) {
            return NextResponse.json({ error: "Ticket already used" }, { status: 400 });
        }

        await db.execute(
            sql`UPDATE ${ticketTable}
                SET isvalid = FALSE, scanned_by = ${userId}, scanned_at = ${new Date().toISOString()}
                WHERE id = ${ticketId} AND eventid = ${eventId}`
        );

        return NextResponse.json({ success: true, message: "Entry allowed" });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
