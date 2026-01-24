import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft } from 'lucide-react';
import { useGuest } from '../context/GuestContext';
import { parseBoardImage } from '../services/geminiService';
import { GameState, BoardData } from '../types';

const ScanPage: React.FC = () => {
    const navigate = useNavigate();
    const { setGuestBoard } = useGuest();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scanProgress, setScanProgress] = useState(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setIsScanning(true);
        setScanProgress(0);

        // Haptic feedback start
        if (navigator.vibrate) navigator.vibrate(50);

        try {
            // Fake progress for UX while processing
            const progressInterval = setInterval(() => {
                setScanProgress(prev => Math.min(prev + 5, 90));
            }, 200);

            // Convert to Base64 for API
            const reader = new FileReader();
            const base64: string = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Image processing failed."));
                reader.readAsDataURL(file);
            });

            // Call API
            const boardData = await parseBoardImage(base64);

            clearInterval(progressInterval);
            setScanProgress(100);

            // Haptic success
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            // Save to Guest Context
            const newGame: GameState = {
                title: "Scanned Board",
                leftAbbr: "AWAY",
                leftName: "Away Team",
                topAbbr: "HOME",
                topName: "Home Team",
                dates: new Date().toISOString().split('T')[0],
                meta: "Imported from scan",
                payouts: { Q1: 0, Q2: 0, Q3: 0, Final: 0 },
                owner_id: "guest", // Temporary
            };

            setGuestBoard({ game: newGame, board: boardData });

            // Redirect to verify/edit (which is CreateContest page for now, but pre-filled)
            // Ideally we pass state or use the context we just set.
            // Let's navigate to /create which should read from GuestContext if user not logged in
            // But wait, /create might reset state?
            // Need to ensure /create handles loading from GuestContext on mount.

            setTimeout(() => {
                navigate('/create');
            }, 800);

        } catch (error) {
            console.error("Scan failed", error);
            alert("Failed to scan board. Please try again or enter manually.");
            setIsScanning(false);
            setPreviewUrl(null);
            if (navigator.vibrate) navigator.vibrate(200); // Error haptic
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <div className="absolute top-6 left-6 z-20">
                <button onClick={() => navigate('/')} className="p-2 rounded-full bg-black/40 text-white/80 hover:bg-white/10 backdrop-blur-md transition-all">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

                {/* Background ambient effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#8F1D2C]/20 to-[#FFC72C]/10 blur-3xl opacity-50 pointer-events-none" />

                {!isScanning ? (
                    <div className="text-center z-10 animate-in fade-in zoom-in duration-500">
                        <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative group cursor-pointer hover:bg-white/10 transition-all" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="w-12 h-12 text-white/70 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />

                            {/* Pulse waves */}
                            <div className="absolute inset-0 rounded-3xl border border-[#FFC72C]/30 animate-ping opacity-20 pointer-events-none"></div>
                        </div>

                        <h2 className="text-3xl font-bold mb-3">Scan your Board</h2>
                        <p className="text-white/50 max-w-sm mx-auto mb-8">
                            Take a photo of your handwritten squares. <br />AI will convert names and numbers instantly.
                        </p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#FFC72C] text-black px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(255,199,44,0.3)] hover:shadow-[0_0_50px_rgba(255,199,44,0.5)] hover:scale-105 transition-all"
                        >
                            Open Camera
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                        />
                    </div>
                ) : (
                    <div className="relative w-full max-w-lg aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                        {/* Image Preview */}
                        {previewUrl && (
                            <img src={previewUrl} className="w-full h-full object-cover opacity-60" alt="Scanning..." />
                        )}

                        {/* Scanner Line Animation */}
                        <div className="absolute inset-0 z-20">
                            <div className="w-full h-1 bg-[#FFC72C] shadow-[0_0_30px_#FFC72C] absolute animate-scan-y"></div>
                        </div>

                        {/* Text Overlay */}
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
                            <div className="text-4xl font-mono font-bold text-white tracking-widest drop-shadow-md">
                                {scanProgress}%
                            </div>
                            <div className="mt-2 text-sm text-[#FFC72C] font-bold uppercase tracking-widest animate-pulse">
                                Analyzing Grid...
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes scan-y {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-y {
                    animation: scan-y 2s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ScanPage;
