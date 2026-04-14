"use client";

import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function AppHeader() {
    const [showJoin, setShowJoin] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinMessage, setJoinMessage] = useState("");
    const [joinError, setJoinError] = useState("");

    const joinWithCode = async () => {
        if (!adminCode.trim()) {
            setJoinError("Please enter an admin code");
            setJoinMessage("");
            return;
        }

        try {
            setJoinLoading(true);
            setJoinError("");
            setJoinMessage("");

            const response = await fetch("/api/events/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminCode: adminCode.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error || "Failed to join event");
            }

            setJoinMessage(`Joined ${data?.name || "event"} as admin`);
            setAdminCode("");
        } catch (error: unknown) {
            setJoinError(error instanceof Error ? error.message : "Failed to join event");
        } finally {
            setJoinLoading(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-slate-900/60 px-4 py-3 backdrop-blur-md">
            <SignedIn>
                <nav className="flex items-center gap-4 text-sm">
                    <Link href="/events" className="text-white/80 transition-colors hover:text-emerald-300">All Events</Link>
                    <Link href="/events/me" className="text-white/80 transition-colors hover:text-emerald-300">My Events</Link>
                    <button onClick={() => setShowJoin((prev) => !prev)} className="rounded-md border border-white/20 bg-white/5 px-4 py-2 text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                        Join via Admin Code
                    </button>
                </nav>
            </SignedIn>

            <div className="flex items-center gap-3">
                <SignedOut>
                    <SignInButton />
                    <SignUpButton />
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>

            {showJoin && (
                <div className="absolute right-4 top-20 z-30 w-80 rounded-xl border border-white/20 bg-slate-900/85 p-4 text-white shadow-[0_0_24px_rgba(20,184,166,0.18)] backdrop-blur-md space-y-4">
                    <p className="text-sm text-white/80">Enter Admin Code</p>
                    <input
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Admin code"
                        className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                        onClick={joinWithCode}
                        disabled={joinLoading}
                        className="w-full rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {joinLoading ? "Joining..." : "Join"}
                    </button>
                    {joinMessage && <p className="text-green-300 text-xs mt-2">{joinMessage}</p>}
                    {joinError && <p className="text-red-300 text-xs mt-2">{joinError}</p>}
                </div>
            )}
        </header>
    );
}
