import React, { useState, useMemo } from 'react';
import { X, Calendar, CheckSquare, Square, Download, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Transaction } from '../../types';
import { parseDateValue } from '../../utils/formatters';

interface ExportSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedMonths: string[]) => void;
    transactions: Transaction[];
    monthNames: string[];
}

export function ExportSelectionModal({ isOpen, onClose, onConfirm, transactions, monthNames }: ExportSelectionModalProps) {
    const availableMonths = useMemo(() => {
        const monthsSet = new Set<string>();
        transactions.forEach(t => {
            if (!t.date) return;
            const d = new Date(parseDateValue(t.date));
            if (!isNaN(d.getTime())) {
                const monthName = monthNames[d.getMonth()];
                const year = d.getFullYear();
                monthsSet.add(`${monthName} ${year}`);
            }
        });

        // Sort months: oldest first (awal bulan sampai akhir)
        return Array.from(monthsSet).sort((a, b) => {
            const [aMonth, aYear] = a.split(' ');
            const [bMonth, bYear] = b.split(' ');
            const aIdx = monthNames.indexOf(aMonth);
            const bIdx = monthNames.indexOf(bMonth);

            if (aYear !== bYear) return Number(aYear) - Number(bYear);
            return aIdx - bIdx;
        });
    }, [transactions, monthNames]);

    const [selected, setSelected] = useState<string[]>([]);

    // Reset selection ONLY when modal is opened
    React.useEffect(() => {
        if (isOpen) {
            // Default to all selected to make it easier for the user
            setSelected([...availableMonths]);
        }
    }, [isOpen]); // Only depend on isOpen to prevent resets while interacting

    if (!isOpen) return null;

    const toggleMonth = (month: string) => {
        if (selected.includes(month)) {
            setSelected(selected.filter(m => m !== month));
        } else {
            setSelected([...selected, month]);
        }
    };

    const toggleAll = () => {
        if (selected.length === availableMonths.length) {
            setSelected([]);
        } else {
            setSelected([...availableMonths]);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden modal-animate">
                {/* Header */}
                <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-stone-800 uppercase tracking-tight">Cetak PDF</h2>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Pilih Bulan Laporan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors active-shrink"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Tersedia: {availableMonths.length} Bulan</p>
                        <button
                            onClick={toggleAll}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded"
                        >
                            {selected.length === availableMonths.length ? 'Hapus Semua' : 'Pilih Semua'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableMonths.map((month) => {
                            const isSelected = selected.includes(month);
                            return (
                                <button
                                    key={month}
                                    onClick={() => toggleMonth(month)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group active-shrink",
                                        isSelected
                                            ? "border-indigo-500 bg-indigo-50/30 text-indigo-700"
                                            : "border-stone-100 bg-white text-stone-600 hover:border-stone-200"
                                    )}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        isSelected ? "bg-indigo-500 text-white" : "bg-stone-50 text-stone-300 group-hover:bg-stone-100"
                                    )}>
                                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </div>
                                    <span className="text-xs font-bold whitespace-nowrap">{month}</span>
                                </button>
                            );
                        })}
                    </div>

                    {selected.length === 0 && (
                        <p className="text-center text-[10px] text-rose-500 font-bold mt-4 flex items-center justify-center gap-1">
                            ⚠️ Pilih setidaknya satu bulan untuk dicetak.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-stone-50/50 border-t border-stone-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 text-xs font-bold text-stone-500 hover:text-stone-700 transition-colors uppercase tracking-widest active-shrink"
                    >
                        Batal
                    </button>
                    <button
                        disabled={selected.length === 0}
                        onClick={() => onConfirm(selected)}
                        className={cn(
                            "flex-[2] py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 active-shrink",
                            selected.length > 0
                                ? "bg-stone-800 text-white hover:bg-stone-900 shadow-stone-200"
                                : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        <Download className="w-4 h-4" /> CETAK {selected.length > 0 ? `(${selected.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
}
