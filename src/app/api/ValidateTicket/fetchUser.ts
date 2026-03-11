import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get("id");

    if (!ticketId) {
        return NextResponse.json({ error: "No ticket ID provided" }, { status: 400 });
    }

    const { data: ticket, error } = await supabase
        .from("tickets")
        .select("ticket_id, is_scanned")
        .eq("ticket_id", ticketId)
        .single();

    if (error || !ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.is_scanned) {
        return NextResponse.json({ scanned: true }, { status: 200 });
    }

    const { error: updateError } = await supabase
        .from("tickets")
        .update({ is_scanned: true })
        .eq("ticket_id", ticketId);

    if (updateError) {
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }

    return NextResponse.json({ scanned: false }, { status: 200 });
}
