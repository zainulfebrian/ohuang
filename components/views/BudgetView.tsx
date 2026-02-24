import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Pencil, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CategoryBudget, CalculatedTransaction } from '../../types';
import { formatCurrency, parseDateValue } from '../../utils/formatters';

interface BudgetViewProps {
    budgets: CategoryBudget[];
    filteredData: CalculatedTransaction[];
    updateBudget: (category: string, limit: number) => void;
    currentMonthYear: string;
    handlePrevMonth?: () => void;
    handleNextMonth?: () => void;
    monthNames: string[];
}

export function BudgetView({
    budgets,
    filteredData,
    updateBudget,
    currentMonthYear,
    handlePrevMonth,
    handleNextMonth,
    monthNames
}: BudgetViewProps) {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    // Calculate actual spending per category for the current month
    const categorySpending = React.useMemo(() => {
        const spending: { [key: string]: number } = {};
        filteredData.forEach(t => {
            const tDate = new Date(parseDateValue(t.date));
            const tMonthYear = `${monthNames[tDate.getMonth()]} ${tDate.getFullYear()}`;

            if (tMonthYear === currentMonthYear) {
                const amount = t.actExpense || t.planExpense || 0;
                if (amount > 0) {
                    // Use lowercase for keys to handle case-insensitive matching
                    const cleanCat = (t.category || "").trim().toLowerCase();
                    spending[cleanCat] = (spending[cleanCat] || 0) + amount;
                }
            }
        });
        return spending;
    }, [filteredData, currentMonthYear, monthNames]);

    const startEditing = (category: string, currentLimit: number) => {
        setEditingCategory(category);
        setEditValue(currentLimit.toString());
    };

    const handleSave = (category: string) => {
        updateBudget(category, Number(editValue) || 0);
        setEditingCategory(null);
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                        <Target className="w-7 h-7 text-indigo-500" />
                        Anggaran & Goals
                    </h2>
                    <p className="text-stone-500 text-sm">Atur batas pengeluaran untuk setiap kategori agar keuangan tetap terkendali.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-1 bg-indigo-50 rounded-lg text-indigo-700 border border-indigo-100/50 min-w-[120px] text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider">{currentMonthYear}</span>
                        </div>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => {
                    const spending = categorySpending[budget.category.toLowerCase().trim()] || 0;
                    const limit = budget.limit;
                    const percent = limit > 0 ? (spending / limit) * 100 : 0;
                    const isOver = limit > 0 && spending > limit;
                    const isWarning = limit > 0 && percent >= 80 && percent <= 100;

                    return (
                        <div key={budget.category} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col animate-bounce-in hover-lift">
                            <div className="p-5 flex flex-col gap-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{budget.category}</span>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-xl font-bold text-stone-800">{formatCurrency(spending)}</span>
                                            <span className="text-xs text-stone-400">terpakai</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => startEditing(budget.category, budget.limit)}
                                        className="p-2 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors active-shrink"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className={cn(isOver ? "text-rose-600" : isWarning ? "text-amber-600" : "text-stone-500")}>
                                            {limit > 0 ? `${percent.toFixed(0)}% dari budget` : "Belum diatur"}
                                        </span>
                                        <span className="text-stone-400">Limit: {formatCurrency(limit)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000",
                                                isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                                            )}
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {limit > 0 && (
                                    <div className={cn("flex items-center gap-2 p-2 rounded-lg text-[10px] font-medium mt-auto",
                                        isOver ? "bg-rose-50 text-rose-600" : isWarning ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                    )}>
                                        {isOver ? (
                                            <>
                                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                <span>Overbudget {formatCurrency(spending - limit)}! Kurangi pengeluaran.</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                <span>Sisa budget Anda: {formatCurrency(limit - spending)}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {editingCategory === budget.category && (
                                <div className="p-4 bg-stone-50 border-t border-stone-200 animate-fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">Rp</span>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-stone-700"
                                                placeholder="Set limit..."
                                            />
                                        </div>
                                        <button
                                            onClick={() => handleSave(budget.category)}
                                            className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingCategory(null)}
                                            className="bg-white border border-stone-200 text-stone-400 p-2.5 rounded-lg hover:bg-stone-50 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
