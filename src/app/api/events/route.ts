import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const events = await db.execute(
            sql`SELECT id, name, date FROM events WHERE status = 'active'`
        );

        return NextResponse.json({ events });
    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
