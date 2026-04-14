import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { adminCode } = body;

        if (!adminCode) {
            return NextResponse.json({ success: false, error: "adminCode is required" }, { status: 400 });
        }

        const existingEvent = await db.execute(
            sql`SELECT id, name FROM events WHERE admin_code = ${adminCode} LIMIT 1`
        );

        const eventRows = existingEvent as unknown as { id: string; name: string }[];

        if (eventRows.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid admin code" }, { status: 404 });
        }

        const eventId = eventRows[0].id;
        const eventName = eventRows[0].name;
        const joinedAt = new Date().toISOString();

        await db.execute(sql`
            INSERT INTO event_members (userid, eventid, role, joined_at)
            VALUES (${userId}, ${eventId}, 'admin', ${joinedAt})
            ON CONFLICT (eventid, userid)
            DO UPDATE SET role = 'admin'
            WHERE event_members.role != 'creator'
        `);

        return NextResponse.json({
            success: true,
            data: {
                message: "Successfully joined as admin",
                eventId,
                name: eventName,
            },
            message: "Successfully joined as admin",
            eventId,
            name: eventName,
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
