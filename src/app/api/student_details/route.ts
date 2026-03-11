import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {studentTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { id, college, stream, year } = await req.json();

        if (!id || !college || !stream || !year) {
            return NextResponse.json({ error: "Missing fields" });
        }

        //if the student already exists
        const existingUser = await db.execute(
            sql`SELECT id FROM ${studentTable} WHERE id = ${id} LIMIT 1`
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ message: "User already exists" });
        }

        //insert the new student
        await db.execute(
            sql`INSERT INTO ${studentTable} (id, college, stream, year) 
                VALUES (${id}, ${college}, ${stream}, ${year})`
        );

        return NextResponse.json({ message: "User added to database" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
