import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PaywallModalProps {
    onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePay = () => {
        // Mock Payment Success
        setStep(2);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Mock Account Creation Delay
        setTimeout(() => {
            // In a real app, we would create the user or send magic link here
            // For now, we redirect to login with special params to simulate "Claiming"
            // But checking requirements: "Capture email... create account for anthony.mora13..."
            navigate('/login?mode=claim&email=' + encodeURIComponent(email) + '&redirect=/');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center overflow-hidden">

                {/* Background Glow */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#FFC72C]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    {step === 1 && (
                        <>
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#9D2235] to-[#7f1d2b] flex items-center justify-center shadow-lg shadow-red-900/40">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white tracking-tight">Unlock Your Board</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Payment required to <b>Generate Live Link</b> and <b>Enable Score Syncing</b>.
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handlePay}
                                    className="w-full py-3.5 rounded-xl bg-[#FFC72C] text-black font-bold text-sm uppercase tracking-wider hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                >
                                    Pay $14.99 to Unlock
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-wider hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Keep Editing Locally
                                </button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in slide-in-from-right-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white tracking-tight">Payment Successful</h2>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Where should we send your admin link?
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="commissioner@example.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] outline-none transition-all placeholder:text-gray-600"
                                />

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full py-3.5 rounded-xl bg-white text-black font-bold text-sm uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? 'Creating Account...' : 'Get My Dashboard'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
