import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ticketTable } from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { scannedData, adminId } = await req.json();

        if (!scannedData) {
            return NextResponse.json({ error: "Missing scannedData" });
        }

        // Check if the student exists and retrieve isvalid status
        const existingUser = await db.execute(
            sql`SELECT id, isvalid FROM ${ticketTable} WHERE id = ${scannedData} LIMIT 1`
        );

        let message = "Ticket not found";

        if (existingUser.length > 0) {
            const { isvalid } = existingUser[0];

            if (!isvalid) {
                message = "Ticket has already been validated";
                //Need help here
            } else {
                await db.execute(
                    sql`UPDATE ${ticketTable} SET isvalid = FALSE, adminid = ${adminId} WHERE id = ${scannedData}`
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
