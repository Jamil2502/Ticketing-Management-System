import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';

interface SimpleQRScannerProps {
    adminId?: string;
}
const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({ adminId }) => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    useEffect(() => {
        return () => {
            if (qrScannerRef.current) {
                if (qrScannerRef.current instanceof QrScanner) {
                    qrScannerRef.current.stop();
                    qrScannerRef.current.destroy();
                }
            }
        };
    }, []);

    const startScanning = () => {
        setStatusMessage(null);
        setIsError(false);

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const scanner = new QrScanner(
            videoElement,
            (result: QrScanner.ScanResult) => {
                if (result.data) {
                    console.log('Scanned result:', result.data);
                    setScanResult(result.data);

                    if (qrScannerRef.current instanceof QrScanner) {
                        qrScannerRef.current.stop();
                        fetch("./api/isscan_ticket", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                scannedData: result.data,
                                adminId: adminId,
                                }),
                        })
                            .then(response => response.json())
                            .then(data => {
                                console.log("Server response:", data);
                                setStatusMessage(data.message);

                                // Show an alert specifically for already validated tickets
                                if (data.message === "Ticket has already been validated") {
                                    alert("Ticket has already been validated");
                                }

                                // Set error state
                                setIsError(data.message === "Ticket has already been validated" ||
                                    data.message === "Ticket not found" ||
                                    data.error !== undefined);
                            })
                            .catch(error => {
                                console.error("Error:", error);
                                setStatusMessage("Error connecting to server");
                                setIsError(true);
                            });
                    }
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
        setScanResult(null);
        setStatusMessage(null);
        setIsError(false);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh', // Full screen height
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

                    {statusMessage && (
                        <div className={`status-message ${isError ? 'text-red-500' : 'text-green-500'}`}>
                            {statusMessage}
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