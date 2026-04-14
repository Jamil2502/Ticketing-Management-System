"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { fetchJsonOrThrow } from "@/lib/safeFetch";

type EventItem = { id: string; name: string; date?: string };
type MyEventItem = { id: string; role: string; isvalid?: boolean | null };
type EventsApiResponse<T> = { events?: T[]; data?: { events?: T[] } };

export default function EventsPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    const [events, setEvents] = useState<EventItem[]>([]);
    const [myEvents, setMyEvents] = useState<MyEventItem[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [generatingEventId, setGeneratingEventId] = useState<string | null>(null);
    const [pageError, setPageError] = useState("");
    const [pageSuccess, setPageSuccess] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createDate, setCreateDate] = useState("");
    const hasFetchedOnLoad = useRef(false);

    const fetchActiveEvents = useCallback(async () => {
        const data = await fetchJsonOrThrow<EventsApiResponse<EventItem>>("/api/events", { cache: "no-store" }, "Failed to load events");
        setEvents(data?.events ?? data?.data?.events ?? []);
    }, []);

    const fetchMyEvents = useCallback(async () => {
        const data = await fetchJsonOrThrow<EventsApiResponse<MyEventItem>>("/api/events/me", { cache: "no-store" }, "Failed to load events");
        setMyEvents(data?.events ?? data?.data?.events ?? []);
    }, []);

    const createEvent = useCallback(async () => {
        if (!user || createLoading) return;
        if (!createName.trim()) {
            setPageError("Event name is required");
            setPageSuccess("");
            return;
        }

        try {
            setCreateLoading(true);
            setPageError("");
            setPageSuccess("");

            await fetchJsonOrThrow("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: createName.trim(),
                    description: createDescription.trim() || undefined,
                    date: createDate.trim() || undefined,
                    userId: user.id,
                }),
            }, "Failed to create event");

            setIsCreateOpen(false);
            setCreateName("");
            setCreateDescription("");
            setCreateDate("");
            await Promise.all([fetchActiveEvents(), fetchMyEvents()]);
            setPageSuccess("Event created");
        } catch (error: unknown) {
            setPageError(error instanceof Error ? error.message : "Failed to create event");
            setPageSuccess("");
        } finally {
            setCreateLoading(false);
        }
    }, [createDate, createDescription, createLoading, createName, fetchActiveEvents, fetchMyEvents, user]);

    const generateTicketForEvent = useCallback(async (eventId: string, eventName: string) => {
        if (!user || generatingEventId !== null) return;

        try {
            setGeneratingEventId(eventId);
            setPageError("");
            setPageSuccess("");

            const ticket = crypto.randomUUID();
            const date = new Date();
            const formattedDate = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;

            const ticketData = await fetchJsonOrThrow<{ ticketId?: string; ticketID?: string; data?: { ticketId?: string; ticketID?: string } }>("/api/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticketId: ticket,
                    title: eventName,
                    uid: user.id,
                    createdAt: formattedDate,
                    torf: true,
                    eventId,
                }),
            }, "Failed to generate ticket");

            const finalTicketId = ticketData.ticketId || ticketData.ticketID || ticketData.data?.ticketId || ticketData.data?.ticketID || ticket;

            await fetchJsonOrThrow("/api/ticket_desc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    descid: finalTicketId,
                    hder: user.firstName,
                    descrip: eventName,
                    footer: user.lastName,
                }),
            }, "Failed to generate ticket");

            router.push("/events/me");
            setPageSuccess("Ticket generated");
        } catch (error: unknown) {
            setPageError(error instanceof Error ? error.message : "Unable to generate ticket.");
        } finally {
            setGeneratingEventId(null);
        }
    }, [generatingEventId, router, user]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push("/sign-in");
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || hasFetchedOnLoad.current) return;
        hasFetchedOnLoad.current = true;
        setEventsLoading(true);
        Promise.all([fetchActiveEvents(), fetchMyEvents()])
            .catch((error: unknown) => {
                setPageError(error instanceof Error ? error.message : "Failed to load events");
            })
            .finally(() => setEventsLoading(false));
    }, [fetchActiveEvents, fetchMyEvents, isLoaded, isSignedIn]);

    const getTicketState = (eventId: string) => {
        const membership = myEvents.find((e) => e.id === eventId);
        if (membership?.role === "creator" || membership?.role === "admin") return "managed";
        const joined = myEvents.find((e) => e.id === eventId && e.role === "member");
        if (!joined) return "none";
        if (joined.isvalid === false) return "used";
        return "joined";
    };

    return (
        <main className="mx-auto max-w-5xl px-6 pt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">All Events</h1>
                <button
                    onClick={() => {
                        setIsCreateOpen((prev) => !prev);
                        setPageError("");
                        setPageSuccess("");
                    }}
                    className="rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Create Event
                </button>
            </div>

            {isCreateOpen && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4">
                    <input
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="Event name"
                        className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                        value={createDescription}
                        onChange={(e) => setCreateDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                        value={createDate}
                        onChange={(e) => setCreateDate(e.target.value)}
                        placeholder="Date (optional)"
                        className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={createEvent}
                            disabled={createLoading}
                            className="rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {createLoading ? "Creating..." : "Create"}
                        </button>
                        <button
                            onClick={() => setIsCreateOpen(false)}
                            className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {pageSuccess && <p className="text-green-300 text-sm">{pageSuccess}</p>}
            {pageError && <p className="text-red-300 text-sm">{pageError}</p>}

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

                                {state === "managed" && (
                                    <button className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60" disabled>
                                        Managed
                                    </button>
                                )}

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
