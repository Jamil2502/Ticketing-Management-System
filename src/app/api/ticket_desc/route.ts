import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {descriptionsTable} from "@/db/schema";

export async function POST(req: Request) {
    try {
        const { descid, hder, descrip, footer } = await req.json();

        if (!descid || !hder || !descrip || !footer) {
            return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
        }

        //if the user already exists
        const existingUser = await db.execute(
            sql`SELECT id FROM ${descriptionsTable} WHERE id = ${descid} LIMIT 1`
        );

        if (existingUser.length > 0) {
            return NextResponse.json({ success: true, data: { message: "Description already exists (no changes made)" }, message: "Description already exists (no changes made)" });
        }

        //inserting the new user
        await db.execute(
            sql`INSERT INTO ${descriptionsTable} (id, header, description, footer)
                VALUES (${descid}, ${hder}, ${descrip}, ${footer})
                ON CONFLICT (id) DO NOTHING`
        );

        return NextResponse.json({ success: true, data: { message: "Description added to database" }, message: "Description added to database" });

    } catch {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
