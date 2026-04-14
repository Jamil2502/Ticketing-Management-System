"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import SimpleQRScanner from "@/components/scanner";

type ManagerData = {
    adminCode: string | null;
    totalTickets: number;
    scannedTickets: number;
    members: { userid: string; role: string }[];
};

export default function EventManagerPage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const params = useParams<{ eventId: string }>();
    const eventId = params?.eventId || "";

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<ManagerData | null>(null);

    const fetchManagerData = useCallback(async () => {
        const response = await fetch(`/api/events/${eventId}/manager`);
        const body = await response.json();

        if (!response.ok) {
            throw new Error(body?.error || "Failed to load manager data");
        }

        const payload = body?.data ?? body;

        setData({
            adminCode: payload?.adminCode ?? null,
            totalTickets: Number(payload?.totalTickets ?? 0),
            scannedTickets: Number(payload?.scannedTickets ?? 0),
            members: Array.isArray(payload?.members) ? payload.members : [],
        });
    }, [eventId]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push("/sign-in");
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (!user || !eventId) return;
        setLoading(true);
        setError("");

        fetchManagerData()
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load manager data"))
            .finally(() => setLoading(false));
    }, [user, eventId, fetchManagerData]);

    if (loading) {
        return <main className="mx-auto max-w-5xl px-6 pt-8 text-white/60 text-sm">Fetching data...</main>;
    }

    if (error) {
        return (
            <main className="mx-auto max-w-5xl px-6 pt-8">
                <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-300 text-sm">{error}</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-6 pt-8 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4">
                <p>Admin Code: <span className="tracking-tight">{data?.adminCode || "N/A"}</span></p>
                <p>Total Tickets: <span className="tracking-tight">{data?.totalTickets ?? 0}</span></p>
                <p>Scanned Tickets: <span className="tracking-tight">{data?.scannedTickets ?? 0}</span></p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4">
                <p className="font-semibold">Members</p>
                {data?.members?.length ? (
                    data.members.map((member) => (
                        <p key={`${member.userid}-${member.role}`} className="text-sm text-white/80">
                            {member.userid} ({member.role})
                        </p>
                    ))
                ) : (
                    <p className="text-sm text-white/60">No members found.</p>
                )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-4 shadow-[0_0_24px_rgba(255,255,255,0.12)]">
                <p className="font-semibold mb-2">Ticket Scanner</p>
                <SimpleQRScanner eventId={eventId} />
            </div>
        </main>
    );
}
