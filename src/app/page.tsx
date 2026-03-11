"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import QrCode from "@/components/QrCode"
import bcrypt from "bcryptjs"
import SimpleQRScanner from "@/components/scanner"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Loader2, Ticket, School, BookOpen, Calendar } from "lucide-react"
import { motion } from "framer-motion"

export default function HomePage() {
    const { user, isSignedIn, isLoaded } = useUser()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    const [cName, setCName] = useState("")
    const [cStream, setCStream] = useState("")
    const [cYear, setCYear] = useState("")
    const [eventTitle, setEventTitle] = useState("")
    const [ticketID, setTicketID] = useState("")

    const [studentExists, setStudentExists] = useState<boolean | null>(null)

    useEffect(() => {
        if (user && user?.publicMetadata?.role !== "admin") {
            const email = user.primaryEmailAddress?.emailAddress || ""

            const salt = bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(email, salt)

            console.log(user?.publicMetadata?.role)

            // Step 1: Sync user
            fetch("/api/sync-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    email: email,
                    password: hash,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                }),
            })
                .then((res) => res.json())
                .then(() => {
                    return fetch("./api/get_student_id", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id }),
                    })
                })
                .then((res) => res.json())
                .then((data) => {
                    if (data.exists) {
                        setStudentExists(true)
                        const eventT = "Ephemeral 2026"
                        setEventTitle(eventT)
                        const ticket = `${email}${user.id}`.trim()
                        console.log(ticket)
                        setTicketID(ticket)
                        const formatDate = (date: Date = new Date()): string => {
                            const day = String(date.getDate()).padStart(2, "0")
                            const month = String(date.getMonth() + 1).padStart(2, "0") // January is 0
                            const year = date.getFullYear()

                            return `${day}-${month}-${year}`
                        }
                        const formattedDate: string = formatDate()
                        console.log(formatDate())
                        fetch("./api/ticket", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                ticketID: ticket,
                                title: eventT,
                                uid: user.id,
                                createdAt: formattedDate,
                                torf: true,
                            }),
                        })
                            .then((res) => res.json())
                            .then((genTick) => {
                                console.log("Ticket Gen response:", genTick)
                                setLoading(false)

                                // Proceed to check ticket description regardless of whether ticket was newly created or already exists
                                const desc = `${ticket} ${eventTitle}`.trim()
                                return fetch("./api/ticket_desc", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        descid: desc,
                                        hder: user.firstName,
                                        descrip: eventT,
                                        footer: user.lastName,
                                    }),
                                })
                            })
                            .then((res) => res.json())
                            .then((descData) => {
                                if (descData.exists) {
                                    console.log("Description already exists")
                                } else {
                                    console.log("New description added:", descData)
                                }
                            })
                            .catch((error) => {
                                console.error("Error:", error)
                                setLoading(false)
                            })
                    } else {
                        setStudentExists(false)
                    }
                    setLoading(false)
                })
                .catch((error) => {
                    console.error("Error:", error)
                    setLoading(false)
                })
        } else if (user && user?.publicMetadata?.role === "admin") {
            const email = user.primaryEmailAddress?.emailAddress || ""

            // Generate a hashed password using bcryptjs
            const salt = bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(email, salt)

            console.log(user?.publicMetadata?.role)

            fetch("./api/sync-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    email: email,
                    password: hash,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    console.log("Sync User Response:", data)
                    fetch("./api/admin_details", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: user.id,
                            name: `${user.firstName} ${user.lastName}`.trim(),
                        }),
                    })
                        .then((res) => res.json())
                        .then((adminData) => {
                            console.log("Admin Details Response:", adminData) // Optional debugging
                            setLoading(false)
                        })
                        .catch((error) => {
                            console.error("Error in admin_details:", error)
                            setLoading(false)
                        })
                })
                .catch((error) => {
                    console.error("Error in sync-user:", error)
                    setLoading(false)
                })
        }
    }, [user])

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/sign-in')
        }
    }, [isLoaded, isSignedIn, router])

    const studentDetails = async () => {
        if (!user || !user.id) {
            alert("User ID is not available yet. Try again.")
            return
        }
        try {
            const res = await fetch("./api/student_details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    college: cName,
                    stream: cStream,
                    year: cYear,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to submit")
            window.location.reload()
        } catch (error: unknown) {
            console.error("Error:", error)
            alert(error)
        }
    }

    if (!isSignedIn) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
                <BackgroundBeams className="opacity-50" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="relative z-10 text-center p-10 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl max-w-md w-full"
                >
                    <Ticket className="w-16 h-16 mx-auto mb-6 text-teal-400" />
                    <h1 className="text-3xl font-bold text-white mb-4">Event Ticketing</h1>
                    <p className="text-lg text-white/80 mb-6">Sign in to access your tickets</p>
                    <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/70">Please authenticate to continue</p>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
                <BackgroundBeams className="opacity-50" />
                <div className="relative z-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                    <h2 className="mt-4 text-xl font-medium text-white">Preparing your experience...</h2>
                </div>
            </div>
        )
    }

    if (studentExists === false) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
                <BackgroundBeams className="opacity-50" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="relative z-10 bg-black/40 rounded-2xl border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.3)] w-full max-w-md p-10"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Complete Your Profile</h2>
                    <p className="text-white/70 mb-8 text-center">Please provide your academic details</p>

                    <div className="space-y-5">
                        <div className="relative">
                            <School className="absolute left-3 top-3 h-5 w-5 text-teal-400" />
                            <input
                                className="bg-black/30 w-full pl-12 p-3 rounded-xl border border-white/10 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 focus:outline-none text-white transition-all duration-200"
                                placeholder="Enter your college"
                                value={cName}
                                onChange={(e) => setCName(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <BookOpen className="absolute left-3 top-3 h-5 w-5 text-teal-400" />
                            <input
                                className="bg-black/30 w-full pl-12 p-3 rounded-xl border border-white/10 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 focus:outline-none text-white transition-all duration-200"
                                placeholder="Enter your stream"
                                value={cStream}
                                onChange={(e) => setCStream(e.target.value)}
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-teal-400" />
                            <input
                                className="bg-black/30 w-full pl-12 p-3 rounded-xl border border-white/10 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20 focus:outline-none text-white transition-all duration-200"
                                placeholder="Enter your year"
                                value={cYear}
                                onChange={(e) => setCYear(e.target.value)}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200"
                            onClick={studentDetails}
                        >
                            Submit Details
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (user?.publicMetadata?.role === "admin") {
        return (
            <div className="relative h-screen w-full flex items-center justify-center bg-gradient-to-b from-black to-gray-900 overflow-hidden">
                <BackgroundBeams className="opacity-50" />
                <div className="relative z-10 flex flex-col w-full max-w-4xl h-full p-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="w-full bg-black/50 backdrop-blur-xl p-4 rounded-2xl border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.15)] mb-3"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            </div>
                            <div className="flex items-center gap-3 bg-teal-900/30 p-2 rounded-xl border border-teal-500/20 self-start">
                                <div className="bg-teal-500/20 p-1.5 rounded-lg">
                                    <Ticket className="h-4 w-4 text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-white/90 text-sm font-medium">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-white/50 text-xs">Event Administrator</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="w-full flex-1 grid grid-cols-1 gap-3 min-h-0"
                    >
                        <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl flex flex-col h-full min-h-0">
                            <div className="p-3 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Ticket Scanner</h2>
                                <div className="px-2 py-0.5 bg-teal-500/20 rounded-full">
                                    <p className="text-teal-300 text-xs font-medium">Ready to scan</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden p-3 min-h-0">
                                <SimpleQRScanner adminId={user.id} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
            <BackgroundBeams className="opacity-50" />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
                className="relative z-10 flex flex-col items-center justify-center max-w-md w-full px-4"
            >
                <div className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.15)] w-full">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-6"
                    >
                        <h1 className="text-2xl font-bold mb-1 text-center text-white">{eventTitle}</h1>
                        <p className="text-white/70 text-center text-sm">
              <span className="font-medium text-teal-300">
                {user?.firstName} {user?.lastName}
              </span>
                        </p>
                    </motion.div>

                    {ticketID ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-xl"></div>
                            <QrCode id={ticketID} />
                        </motion.div>
                    ) : (
                        <div className="flex items-center justify-center p-8 bg-black/30 rounded-xl">
                            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                            <p className="ml-3 text-white">Generating QR Code...</p>
                        </div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-6 space-y-3"
                    >
                        <div className="p-4 bg-teal-900/20 rounded-xl border border-teal-500/20 flex items-center">
                            <div className="bg-teal-500/20 p-2 rounded-lg mr-3">
                                <Ticket className="h-5 w-5 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-white/90 text-sm">Present this QR code at the event entrance</p>
                                <p className="text-white/50 text-xs">Ticket will be scanned for verification</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-white/50 px-2">
                            <p>ID: {ticketID?.substring(0, 8)}...</p>
                            <p>{new Date().toLocaleDateString()}</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
