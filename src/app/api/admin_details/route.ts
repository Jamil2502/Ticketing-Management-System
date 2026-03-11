import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {adminTable} from "@/db/schema";


export async function POST(req: Request) {
    try {
        const { id, name } = await req.json();

        if (!id || !name) {
            return NextResponse.json({ error: "Missing fields" });
        }

        // if admin exists
        const existingUser = await db.execute(
            sql`SELECT name FROM ${adminTable} WHERE name = ${name} LIMIT 1`
        );

        if (existingUser.length === 0) {
            // if he doesn't exist we add him
            await db.execute(
                sql`INSERT INTO ${adminTable} (id, name) VALUES (${id}, ${name})`
            );

            return NextResponse.json({ message: "User added to Supabase" });
        }

        return NextResponse.json({ message: "User already exists" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
