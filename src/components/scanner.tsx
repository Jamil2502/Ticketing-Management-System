import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

interface SimpleQRScannerProps {
    eventId: string;
}
const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({ eventId }) => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">("idle");
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const isProcessingRef = useRef<boolean>(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef<boolean>(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (qrScannerRef.current) {
                if (qrScannerRef.current instanceof QrScanner) {
                    qrScannerRef.current.stop();
                    qrScannerRef.current.destroy();
                    qrScannerRef.current = null;
                }
            }
        };
    }, []);

    const startScanning = () => {
        if (qrScannerRef.current instanceof QrScanner) return;

        setScanMessage(null);
        setScanStatus("idle");

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const scanner = new QrScanner(
            videoElement,
            (result: QrScanner.ScanResult) => {
                if (result.data && !isProcessingRef.current) {
                    isProcessingRef.current = true;
                    const ticketId = result.data.trim();
                    setScanResult(ticketId);

                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }

                    fetch("/api/ticket/scan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ticketId,
                            eventId: eventId,
                        }),
                    })
                        .then(async (response) => {
                            const data = await response.json();

                            if (!response.ok) {
                                throw new Error(data?.error || data?.message || "Scan failed");
                            }

                            if (!isMountedRef.current) return;
                            setScanStatus("success");
                            setScanMessage("Entry allowed");
                        })
                        .catch((error: unknown) => {
                            const message = error instanceof Error ? error.message : "";
                            const normalized = message.toLowerCase();
                            const fallbackMessage = normalized.includes("fetch")
                                ? "Connection error — try again"
                                : (message || "Connection error — try again");

                            if (!isMountedRef.current) return;
                            setScanStatus("error");
                            setScanMessage(fallbackMessage);
                        })
                        .finally(() => {
                            timeoutRef.current = setTimeout(() => {
                                if (!isMountedRef.current) return;
                                setScanStatus("idle");
                                setScanMessage(null);
                                setScanResult(null);
                                isProcessingRef.current = false;
                            }, 2500);
                        });
                }
            },
            {
                highlightScanRegion: true,
                returnDetailedScanResult: true
            }
        );

        qrScannerRef.current = scanner;
        scanner.start();
    };

    const stopScanning = () => {
        if (qrScannerRef.current instanceof QrScanner) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        isProcessingRef.current = false;
        setScanResult(null);
        setScanMessage(null);
        setScanStatus("idle");
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            textAlign: 'center',
        }}>
            <video
                ref={videoRef}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    display: scanResult ? 'none' : 'block'
                }}
            />

            {!scanResult ? (
                <div>
                    <button
                        onClick={startScanning}
                        className="relative px-6 py-3 text-white bg-black border border-white rounded-md overflow-hidden hover:shadow-[0_0_15px_2px_#1e90ff] transition-shadow duration-300"
                    >
                        Start Scanning
                    </button>
                    <button
                        onClick={stopScanning}
                        className="relative px-6 py-3 text-white bg-black border border-white rounded-md overflow-hidden hover:shadow-[0_0_15px_2px_#ff1a1a] transition-shadow duration-300"
                    >
                        Stop Scanning
                    </button>
                </div>


            ) : (
                <div>
                    <p>Scanned Result: {scanResult}</p>

                    {scanMessage && (
                        <div className={`status-message px-3 py-2 rounded-md ${scanStatus === "success" ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                            {scanMessage}
                        </div>
                    )}

                    <button
                        onClick={stopScanning}
                        className="relative px-6 py-3 text-white bg-black border border-white rounded-md overflow-hidden hover:shadow-[0_0_15px_2px_#1e90ff] transition-shadow duration-300"
                    >
                        Scan Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default SimpleQRScanner;
