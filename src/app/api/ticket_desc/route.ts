import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {descriptionsTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { descid, hder, descrip, footer } = await req.json();

        if (!descid || !hder || !descrip || !footer) {
            return NextResponse.json({ error: "Missing fields" });
        }

        //if the user already exists
        const existingUser = await db.execute(
            sql`SELECT id FROM ${descriptionsTable} WHERE id = ${descid} LIMIT 1`
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ message: "Description already exists" });
        }

        //inserting the new user
        await db.execute(
            sql`INSERT INTO ${descriptionsTable} (id, header, description, footer) VALUES (${descid}, ${hder}, ${descrip}, ${footer})`
        );

        return NextResponse.json({ message: "Description added to database" });

    } catch (error: unknown) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error });
    }
}
