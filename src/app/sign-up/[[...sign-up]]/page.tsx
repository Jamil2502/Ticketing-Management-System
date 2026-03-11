"use client"

import {SignUp} from "@clerk/nextjs"
import { BackgroundBeams } from "@/components/ui/background-beams"
import { Ticket } from "lucide-react"
import { motion } from "framer-motion"

export default function Page() {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900 overflow-hidden">
            <BackgroundBeams className="opacity-40" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="relative z-10 p-6 sm:p-8 md:p-10 bg-black/70 backdrop-blur-2xl rounded-3xl border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.15)] max-w-md w-full"
            >
                <div className="mb-6 text-center">
                    <Ticket className="w-12 h-12 mx-auto mb-4 text-teal-400" />
                    <h1 className="text-2xl font-bold text-white">Kreiva X Alfaaz</h1>
                    <p className="text-teal-300/80 mt-1">Event Ticketing System</p>
                </div>

                <SignUp
                    appearance={{
                        variables: {
                            colorBackground: "transparent",
                        },
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-transparent shadow-none mx-auto text-center",
                            headerTitle: "text-white text-xl font-bold",
                            headerSubtitle: "text-white/70",
                            formButtonPrimary:
                                "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-teal-500/20 transition-all duration-200",
                            formButtonReset: "text-teal-400 hover:text-teal-300",
                            formFieldLabel: "text-white/80",
                            formFieldInput:
                                "bg-black/50 border-white/10 text-white rounded-xl placeholder:text-white/40 focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/30 outline-none focus:outline-none focus-visible:outline-teal-500/40 focus-visible:outline focus-visible:outline-2 transition-all",
                            footerActionLink: "text-teal-400 hover:text-teal-300 font-medium",
                            identityPreviewEditButton: "text-teal-400 hover:text-teal-300",
                            formResendCodeLink: "text-teal-400 hover:text-teal-300",
                            otpCodeFieldInput:
                                "bg-black/50 border-white/10 text-white focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20",
                            dividerLine: "bg-white/10",
                            dividerText: "text-white/50",
                            socialButtonsBlockButton:
                                "border-white/10 bg-black/30 hover:bg-black/50 text-white transition-all duration-200",
                            socialButtonsBlockButtonText: "text-white font-medium",
                            formFieldAction: "text-teal-400 hover:text-teal-300",
                            formFieldSuccessText: "text-emerald-400",
                            formFieldErrorText: "text-red-400",
                            alert: "bg-red-500/20 border border-red-500/30 text-white",
                            alertText: "text-white",
                            userPreviewMainIdentifier: "text-white",
                            userPreviewSecondaryIdentifier: "text-white/70",
                            userButtonPopoverActionButton: "hover:bg-black/10",
                            userButtonPopoverActionButtonText: "text-white",
                            userButtonPopoverActionButtonIcon: "text-white/70",
                            footer: "bg-transparent text-white",
                        },
                    }}
                />

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-white/50 text-sm">Secure authentication powered by Clerk</p>
                </div>
            </motion.div>
        </div>
    )
}
