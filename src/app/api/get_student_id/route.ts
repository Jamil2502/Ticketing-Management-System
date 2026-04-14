import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {studentTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
        }

        //if the student exists using raw SQL
        const existingUser = await db.execute(
            sql`SELECT id FROM ${studentTable} WHERE id = ${id} LIMIT 1`
        );

        if (existingUser.length === 0) {
            return NextResponse.json({ success: true, data: { exists: false }, exists: false });
        }

        return NextResponse.json({ success: true, data: { exists: true }, exists: true });

    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
