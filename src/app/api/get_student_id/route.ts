import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {studentTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Missing ID" });
        }

        //if the student exists using raw SQL
        const existingUser = await db.execute(
            sql`SELECT id FROM ${studentTable} WHERE id = ${id} LIMIT 1`
        );

        if (existingUser.length === 0) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
