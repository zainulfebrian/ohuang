import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, Lightbulb, ChevronRight } from 'lucide-react';

export interface HelpItem {
    title: string;
    desc: string;
}

interface HelpButtonProps {
    title: string;
    tips: HelpItem[];
    size?: 'sm' | 'md';
}

// Global singleton: only one panel open at a time
let globalCloseFn: (() => void) | null = null;

export function HelpButton({ title, tips, size = 'sm' }: HelpButtonProps) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef<HTMLButtonElement>(null);

    // Stable close function — does NOT re-create on every render
    const closeSelf = useCallback(() => setOpen(false), []);
    // Keep a ref so the useEffect callback always has the latest stable ref
    const closeSelfRef = useRef(closeSelf);
    closeSelfRef.current = closeSelf;

    // Global singleton: close previously opened panel when this one opens
    useEffect(() => {
        if (!open) return;
        // Close any other open panel
        if (globalCloseFn && globalCloseFn !== closeSelfRef.current) {
            globalCloseFn();
        }
        globalCloseFn = closeSelfRef.current;
        return () => {
            if (globalCloseFn === closeSelfRef.current) globalCloseFn = null;
        };
    }, [open]);

    // Escape key closes panel
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const handleOpen = () => {
        if (open) { setOpen(false); return; }

        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const PANEL_W = Math.min(272, vw - 24); // never wider than screen
            const PANEL_H = Math.min(tips.length * 70 + 100, 400);

            // Horizontal: try right of button, then left, then clamp
            let left = rect.right + 10;
            if (left + PANEL_W > vw - 8) {
                left = rect.left - PANEL_W - 10;
            }
            left = Math.max(8, Math.min(left, vw - PANEL_W - 8));

            // Vertical: try below button, then above
            let top = rect.bottom + 8;
            if (top + PANEL_H > vh - 8) {
                top = rect.top - PANEL_H - 8;
            }
            top = Math.max(8, Math.min(top, vh - PANEL_H - 8));

            setPos({ top, left });
        }
        setOpen(true);
    };

    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    const btnSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

    const panel = open ? (
        <>
            {/* Backdrop — catches outside clicks, no visual effect */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Panel — rendered via portal so CSS transforms on ancestors don't affect fixed positioning */}
            <div
                className="fixed z-[9999] bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-help-panel"
                style={{ top: pos.top, left: pos.left, width: Math.min(272, window.innerWidth - 24) }}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-label={title}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-stone-50 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-amber-100 rounded-lg shrink-0">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                        </div>
                        <span className="text-[11px] font-semibold text-stone-600 truncate">{title}</span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="p-1 rounded-full hover:bg-stone-200/70 text-stone-400 hover:text-stone-600 transition-colors shrink-0 ml-2"
                        aria-label="Tutup"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>

                {/* Tips */}
                <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                    {tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-indigo-50/50 transition-colors group">
                            <div className="p-1 bg-indigo-50 rounded-lg shrink-0 mt-0.5 group-hover:bg-indigo-100 transition-colors">
                                <ChevronRight className="w-2.5 h-2.5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold text-stone-700 leading-snug">{tip.title}</p>
                                <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-3.5 py-2 border-t border-stone-100/80">
                    <p className="text-[9px] text-stone-300 text-center tracking-wide">Klik di luar untuk menutup</p>
                </div>
            </div>
        </>
    ) : null;

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleOpen}
                className={`
                    flex items-center justify-center ${btnSize} rounded-full border
                    transition-all duration-150 shrink-0
                    ${open
                        ? 'bg-indigo-500 border-indigo-400 text-white shadow-sm shadow-indigo-200/60 scale-110'
                        : 'bg-white/80 border-stone-200 text-stone-400 hover:border-indigo-300 hover:text-indigo-400 hover:bg-indigo-50/80 hover:scale-105'
                    }
                `}
                title="Bantuan & Tips"
                aria-label="Bantuan & Tips"
                aria-expanded={open}
            >
                <HelpCircle className={iconSize} />
            </button>

            {/* Portal: mounts at document.body level, bypasses all ancestor CSS transforms */}
            {typeof document !== 'undefined' && createPortal(panel, document.body)}
        </>
    );
}
