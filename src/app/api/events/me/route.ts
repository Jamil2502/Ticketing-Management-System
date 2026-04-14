import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const events = await db.execute(
            sql`SELECT e.id, e.name, e.description, e.date, e.status, e.created_at, em.role, em.joined_at
                FROM events e
                JOIN event_members em ON e.id = em.eventid
                WHERE em.userid = ${userId}
                ORDER BY e.created_at DESC`
        );

        const eventRows = (events as unknown as { rows: unknown[] }).rows;

        return NextResponse.json({ events: eventRows });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
