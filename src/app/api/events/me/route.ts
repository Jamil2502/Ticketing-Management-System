import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const events = await db.execute(
            sql`SELECT e.id, e.name, e.description, e.date, e.status, e.created_at, em.role, em.joined_at, t.isvalid, t.id AS ticketid
                FROM events e
                JOIN event_members em ON e.id = em.eventid
                LEFT JOIN tickets t ON t.eventid = e.id AND t.userid = em.userid
                WHERE em.userid = ${userId}
                ORDER BY e.created_at DESC`
        );

        const eventRows = Array.isArray(events)
            ? events
            : (events as unknown as { rows?: unknown[] }).rows ?? [];

        return NextResponse.json({ success: true, data: { events: eventRows }, events: eventRows });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
