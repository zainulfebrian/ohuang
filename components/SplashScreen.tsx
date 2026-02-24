import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
    appVersion: string;
    onFinish: () => void;
}

export function SplashScreen({ appVersion, onFinish }: SplashScreenProps) {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const DURATION = 3000; // 3 seconds

    useEffect(() => {
        const startTime = Date.now();
        let raf: number;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / DURATION) * 100, 100);
            setProgress(pct);

            if (pct < 100) {
                raf = requestAnimationFrame(animate);
            } else {
                // Fade out then call onFinish
                setTimeout(() => setFadeOut(true), 200);
                setTimeout(() => onFinish(), 800);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [onFinish]);

    const loadingMessages = [
        'Memuat data keuangan...',
        'Menyiapkan analitik...',
        'Menghitung saldo...',
        'Hampir selesai...',
        'Selamat datang!'
    ];
    const msgIndex = Math.min(Math.floor(progress / 20), 4);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1b2a4a 50%, #0d1829 100%)' }}
        >
            {/* Decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #4a90d9, transparent)' }} />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
            </div>

            {/* Content */}
            <div className="relative flex flex-col items-center gap-6 px-8 w-full max-w-xs">
                {/* Logo */}
                <div className="animate-bounce-in">
                    <img
                        src="/logo.png"
                        alt="OhMonsea"
                        className="h-24 w-auto object-contain drop-shadow-2xl"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                </div>

                {/* App name & tagline */}
                <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <p className="text-white/50 text-[11px] uppercase tracking-[0.3em] font-semibold mb-1">Self Finance</p>
                    <p className="text-white/30 text-[10px] tracking-widest">Kelola keuangan dengan bijak</p>
                </div>

                {/* Loading bar */}
                <div className="w-full space-y-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    {/* Track */}
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                        {/* Glow trail */}
                        <div
                            className="absolute top-0 left-0 h-full rounded-full transition-none"
                            style={{
                                width: `${progress}%`,
                                background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
                                boxShadow: '0 0 12px 2px rgba(96,165,250,0.7)',
                                transition: 'width 0.05s linear',
                            }}
                        />
                        {/* Shimmer dot at tip */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"
                            style={{
                                left: `calc(${progress}% - 4px)`,
                                boxShadow: '0 0 8px 3px rgba(255,255,255,0.8)',
                                transition: 'left 0.05s linear',
                            }}
                        />
                    </div>

                    {/* Status message */}
                    <div className="flex justify-between items-center">
                        <p className="text-white/40 text-[10px] font-medium tracking-wide">
                            {loadingMessages[msgIndex]}
                        </p>
                        <p className="text-white/40 text-[10px] font-mono">
                            {Math.round(progress)}%
                        </p>
                    </div>
                </div>

                {/* Version + author */}
                <div className="text-center mt-4 animate-fade-in space-y-1" style={{ animationDelay: '0.7s' }}>
                    <p className="text-white/25 text-[9px] uppercase tracking-[0.25em]">v{appVersion}</p>
                    <p className="text-white/20 text-[9px] tracking-widest">by hanya.rian</p>
                </div>
            </div>
        </div>
    );
}
