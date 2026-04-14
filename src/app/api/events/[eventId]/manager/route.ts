import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { eventId } = await params;

        if (!eventId) {
            return NextResponse.json({ success: false, error: "eventId is required" }, { status: 400 });
        }

        const authCheck = await db.execute(
            sql`SELECT role FROM event_members
                WHERE eventid = ${eventId} AND userid = ${userId}
                AND role IN ('creator', 'admin')
                LIMIT 1`
        );

        const authRows = authCheck as unknown as { role: string }[];

        if (authRows.length === 0) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const [eventData, ticketStats, membersData] = await Promise.all([
            db.execute(sql`SELECT admin_code FROM events WHERE id = ${eventId} LIMIT 1`),
            db.execute(sql`
                SELECT
                    COUNT(*) AS total_tickets,
                    COUNT(CASE WHEN scanned_at IS NOT NULL THEN 1 END) AS scanned_tickets
                FROM tickets
                WHERE eventid = ${eventId}
            `),
            db.execute(sql`
                SELECT userid, role
                FROM event_members
                WHERE eventid = ${eventId}
                ORDER BY joined_at ASC
            `),
        ]);

        const eventRows = eventData as unknown as { admin_code: string | null }[];
        const ticketRows = ticketStats as unknown as { total_tickets?: string | number | null; scanned_tickets?: string | number | null }[];
        const memberRows = membersData as unknown as { userid: string; role: string }[];

        if (eventRows.length === 0) {
            return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
        }

        const statsRow = ticketRows[0] ?? { total_tickets: 0, scanned_tickets: 0 };

        return NextResponse.json({
            success: true,
            data: {
                adminCode: eventRows[0].admin_code,
                totalTickets: Number(statsRow.total_tickets ?? 0),
                scannedTickets: Number(statsRow.scanned_tickets ?? 0),
                members: memberRows,
            },
            adminCode: eventRows[0].admin_code,
            totalTickets: Number(statsRow.total_tickets ?? 0),
            scannedTickets: Number(statsRow.scanned_tickets ?? 0),
            members: memberRows,
        });
    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
