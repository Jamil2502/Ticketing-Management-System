"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type EventItem = { id: string; name: string; date?: string };
type MyEventItem = { id: string; role: string; isvalid?: boolean | null };

export default function EventsPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    const [events, setEvents] = useState<EventItem[]>([]);
    const [myEvents, setMyEvents] = useState<MyEventItem[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [generatingEventId, setGeneratingEventId] = useState<string | null>(null);

    const fetchActiveEvents = async () => {
        const response = await fetch("/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(Array.isArray(data?.events) ? data.events : []);
    };

    const fetchMyEvents = async () => {
        const response = await fetch("/api/events/me");
        if (!response.ok) throw new Error("Failed to fetch my events");
        const data = await response.json();
        setMyEvents(Array.isArray(data?.events) ? data.events : []);
    };

    const generateTicketForEvent = async (eventId: string, eventName: string) => {
        if (!user) return;

        try {
            setGeneratingEventId(eventId);

            const ticket = crypto.randomUUID();
            const date = new Date();
            const formattedDate = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;

            const ticketRes = await fetch("/api/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketID: ticket,
                    title: eventName,
                    uid: user.id,
                    createdAt: formattedDate,
                    torf: true,
                    eventId,
                }),
            });

            const ticketData = await ticketRes.json();
            if (!ticketRes.ok || ticketData.error) {
                throw new Error(ticketData.error || "Failed to generate ticket");
            }

            const finalTicketId = ticketData.ticketID || ticket;

            await fetch("/api/ticket_desc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    descid: finalTicketId,
                    hder: user.firstName,
                    descrip: eventName,
                    footer: user.lastName,
                }),
            });

            await fetchMyEvents();
        } catch (error: unknown) {
            alert(error instanceof Error ? error.message : "Unable to generate ticket.");
        } finally {
            setGeneratingEventId(null);
        }
    };

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push("/sign-in");
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (!user) return;
        setEventsLoading(true);
        Promise.all([fetchActiveEvents(), fetchMyEvents()]).finally(() => setEventsLoading(false));
    }, [user]);

    const getTicketState = (eventId: string) => {
        const joined = myEvents.find((e) => e.id === eventId && e.role === "member");
        if (!joined) return "none";
        if (joined.isvalid === false) return "used";
        return "joined";
    };

    return (
        <main className="mx-auto max-w-5xl px-6 pt-8 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">All Events</h1>

            {eventsLoading ? (
                <p className="text-white/60 text-sm">Loading events...</p>
            ) : events.length === 0 ? (
                <p className="text-white/70">No active events available.</p>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((eventItem) => {
                        const state = getTicketState(eventItem.id);
                        return (
                            <div key={eventItem.id} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] space-y-4">
                                <p className="font-semibold">{eventItem.name}</p>
                                {eventItem.date && <p className="text-sm text-white/60">{eventItem.date}</p>}

                                {state === "none" && (
                                    <button
                                        className="rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={() => generateTicketForEvent(eventItem.id, eventItem.name)}
                                        disabled={generatingEventId !== null}
                                    >
                                        {generatingEventId === eventItem.id ? "Generating..." : "Get Ticket"}
                                    </button>
                                )}

                                {state === "joined" && (
                                    <button className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60" disabled>
                                        Joined
                                    </button>
                                )}

                                {state === "used" && (
                                    <button className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60" disabled>
                                        Used
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
