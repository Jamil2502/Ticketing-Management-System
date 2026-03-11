import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {usersTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { id, email, password, name } = await req.json();

        if (!id || !email || !password || !name) {
            return NextResponse.json({ error: "Missing fields" });
        }

        //if the user already exists
        const existingUser = await db.execute(
            sql`SELECT id FROM ${usersTable} WHERE email = ${email} LIMIT 1`
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ message: "User already exists" });
        }

        //inserting the new user
        await db.execute(
            sql`INSERT INTO ${usersTable} (id, email, password, name) VALUES (${id}, ${email}, ${password}, ${name})`
        );

        return NextResponse.json({ message: "User added to database" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
