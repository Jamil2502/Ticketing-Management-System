import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ticketTable } from "@/db/schema";

const LEGACY_EVENT_ID = "legacy-single-event";

export async function POST(req: Request) {
    try {
        const { scannedData, adminId, eventId } = await req.json();
        const resolvedEventId = eventId || LEGACY_EVENT_ID;

        if (!scannedData) {
            return NextResponse.json({ error: "Missing scannedData" });
        }

        if (!eventId) {
            console.warn(`[MIGRATION WARNING] /api/isscan_ticket fallback to legacy event for admin ${adminId || "unknown"}`);
        }

        // Check if the student exists and retrieve isvalid status
        const existingUser = eventId
            ? await db.execute(
                sql`SELECT id, isvalid FROM ${ticketTable} WHERE id = ${scannedData} AND eventid = ${resolvedEventId} LIMIT 1`
            )
            : await db.execute(
                sql`SELECT id, isvalid FROM ${ticketTable} WHERE id = ${scannedData} AND (eventid = ${resolvedEventId} OR eventid IS NULL) LIMIT 1`
            );

        let message = "Ticket not found";

        if (existingUser.length > 0) {
            const { isvalid } = existingUser[0];

            if (!isvalid) {
                message = "Ticket has already been validated";
                //Need help here
            } else {
                await db.execute(
                    sql`UPDATE ${ticketTable} SET isvalid = FALSE, adminid = ${adminId}, scanned_at = ${new Date().toISOString()} WHERE id = ${scannedData} AND (eventid = ${resolvedEventId} OR eventid IS NULL)`
                );
                message = "Ticket validated successfully";
            }
        }

        return NextResponse.json({ message });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
