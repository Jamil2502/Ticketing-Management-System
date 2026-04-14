"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import bcrypt from "bcryptjs";

export default function HomePage() {
    const { user, isSignedIn, isLoaded } = useUser();
    const router = useRouter();

    const [cName, setCName] = useState("");
    const [cStream, setCStream] = useState("");
    const [cYear, setCYear] = useState("");
    const [loading, setLoading] = useState(true);
    const [studentExists, setStudentExists] = useState<boolean | null>(null);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/sign-in");
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        if (!user) return;

        const email = user.primaryEmailAddress?.emailAddress || "";
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(email, salt);

        fetch("/api/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.id,
                email,
                password: hash,
                name: `${user.firstName} ${user.lastName}`.trim(),
            }),
        })
            .then((res) => res.json())
            .then(() => {
                return fetch("/api/get_student_id", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: user.id }),
                });
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.exists) {
                    setStudentExists(true);
                    router.push("/events");
                } else {
                    setStudentExists(false);
                }
            })
            .catch(() => {
                setStudentExists(false);
            })
            .finally(() => setLoading(false));
    }, [user, router]);

    const studentDetails = async () => {
        if (!user?.id) return;

        const res = await fetch("/api/student_details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: user.id,
                college: cName,
                stream: cStream,
                year: cYear,
            }),
        });

        if (res.ok) {
            router.push("/events");
        }
    };

    if (loading) {
        return <main className="mx-auto max-w-3xl px-6 pt-8 text-white/60 text-sm">Loading...</main>;
    }

    if (studentExists === false) {
        return (
            <main className="mx-auto max-w-3xl px-6 pt-8 space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Complete Your Profile</h1>
                <input className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none" placeholder="College" value={cName} onChange={(e) => setCName(e.target.value)} />
                <input className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none" placeholder="Stream" value={cStream} onChange={(e) => setCStream(e.target.value)} />
                <input className="w-full rounded-md border border-white/20 bg-white/5 p-2 text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none" placeholder="Year" value={cYear} onChange={(e) => setCYear(e.target.value)} />
                <button className="rounded-md bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" onClick={studentDetails}>Submit</button>
            </main>
        );
    }

    return <main className="mx-auto max-w-3xl px-6 pt-8 text-white/60 text-sm">Redirecting to events...</main>;
}
