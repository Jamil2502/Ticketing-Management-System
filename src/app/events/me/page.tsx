"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import QrCode from "@/components/QrCode";

type MyEvent = {
    id: string;
    name: string;
    role: string;
    isvalid?: boolean | null;
    ticketid?: string | null;
};

export default function MyEventsPage() {
    const { isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    const [events, setEvents] = useState<MyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const hasFetchedOnLoad = useRef(false);

    const fetchMyEvents = async () => {
        const response = await fetch("/api/events/me");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to fetch my events");
        setEvents(Array.isArray(data?.events) ? data.events : []);
    };

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push("/sign-in");
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || hasFetchedOnLoad.current) return;
        hasFetchedOnLoad.current = true;
        setLoading(true);
        setError("");
        fetchMyEvents()
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to fetch my events"))
            .finally(() => setLoading(false));
    }, [isLoaded, isSignedIn]);

    return (
        <main className="mx-auto max-w-4xl px-6 pt-8 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">My Events</h1>

            {loading ? (
                <p className="text-white/60 text-sm">Loading my events...</p>
            ) : error ? (
                <p className="text-red-300 text-sm">{error}</p>
            ) : events.length === 0 ? (
                <p className="text-white/70">You have not joined any events yet.</p>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-semibold">{event.name}</p>
                                    <p className="text-sm text-white/60">Role: {event.role}</p>
                                </div>

                                {(event.role === "admin" || event.role === "creator") && (
                                    <Link href={`/events/${event.id}/manager`} className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                                        Manage
                                    </Link>
                                )}
                            </div>

                            {event.ticketid && event.isvalid !== false && (
                                <div className="inline-block rounded-lg bg-white p-3 shadow-[0_0_24px_rgba(255,255,255,0.2)]">
                                    <QrCode id={event.ticketid} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
