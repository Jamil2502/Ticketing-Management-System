import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
    try {
        const events = await db.execute(
            sql`SELECT id, name, date FROM events WHERE status = 'active'`
        );

        return NextResponse.json({ success: true, data: { events }, events });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, date, userId } = body;

        if (!name || !userId) {
            return NextResponse.json(
                { success: false, error: "Name and userId are required" },
                { status: 400 }
            );
        }

        const eventId = crypto.randomUUID();
        const adminCode = crypto.randomBytes(16).toString("hex");
        const createdAt = new Date().toISOString();
        const status = "active";

        await db.transaction(async (tx) => {
            await tx.execute(sql`
                INSERT INTO events (id, name, description, date, status, created_by, created_at, admin_code)
                VALUES (${eventId}, ${name}, ${description ?? null}, ${date ?? null}, ${status}, ${userId}, ${createdAt}, ${adminCode})
            `);

            await tx.execute(sql`
                INSERT INTO event_members (userid, eventid, role, joined_at)
                VALUES (${userId}, ${eventId}, 'creator', ${createdAt})
            `);
        });

        return NextResponse.json({
            success: true,
            data: { eventId, adminCode },
            eventId,
            adminCode,
        });
    } catch {
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
