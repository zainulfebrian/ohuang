import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let nextId = React.useRef(0);

    const toast = useCallback((message: string, type: ToastType = 'success') => {
        const id = ++nextId.current;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const iconMap: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
        error: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
        info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    };

    const bgMap: Record<ToastType, string> = {
        success: 'bg-white border-emerald-200',
        error: 'bg-white border-rose-200',
        info: 'bg-white border-blue-200',
        warning: 'bg-white border-amber-200',
    };

    const portal = typeof document !== 'undefined' ? createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
            {toasts.map((t, i) => (
                <div
                    key={t.id}
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border pointer-events-auto',
                        'max-w-xs w-full text-sm font-medium text-stone-800',
                        'animate-toast-in',
                        bgMap[t.type]
                    )}
                    style={{ animationDelay: `${i * 20}ms` }}
                >
                    {iconMap[t.type]}
                    <span className="flex-1 text-[12px] leading-tight">{t.message}</span>
                    <button
                        onClick={() => dismiss(t.id)}
                        className="text-stone-400 hover:text-stone-600 transition-colors ml-1 shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    ) : null;

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {portal}
        </ToastContext.Provider>
    );
}
