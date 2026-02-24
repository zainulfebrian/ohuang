import React from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardsProps {
    totals: {
        finalEstBalance: number;
        finalActBalance: number;
        periodIncome: number;
        periodExpense: number;
    };
}

export function SummaryCards({ totals }: SummaryCardsProps) {
    const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-stone-50 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Balance */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group animate-bounce-in stagger-1 hover-lift">
                    <div className={cn("absolute right-0 top-0 p-3 opacity-10 rounded-bl-xl", btnPrimaryClass)}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sisa Saldo Aktual</p>
                    <h3 className={cn("text-xl font-bold mt-1", totals.finalActBalance < 0 ? "text-rose-600" : "text-stone-800")}>
                        {formatCurrency(totals.finalActBalance)}
                    </h3>
                    <div className="mt-2 text-[10px] text-stone-500">
                        Est: {formatCurrency(totals.finalEstBalance)}
                    </div>
                </div>

                {/* Card 2: Period Summary */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm animate-bounce-in stagger-2 hover-lift">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Masuk</p>
                            <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodIncome)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Keluar</p>
                            <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodExpense)}</p>
                        </div>
                    </div>
                    {/* Progress Bar Income vs Expense */}
                    <div className="w-full bg-stone-100 h-1.5 mt-3 rounded-full overflow-hidden flex">
                        <div className="bg-rose-500 h-full transition-all duration-1000" style={{ width: `${Math.min((totals.periodExpense / (totals.periodIncome || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>

                {/* Card 3: Savings Goal (Mockup) */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm animate-bounce-in stagger-3 hover-lift">
                    <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Target: Laptop Baru</p>
                        <span className="text-[10px] font-bold text-indigo-500">45%</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-700">{formatCurrency(totals.finalActBalance)} <span className="text-[10px] text-stone-400 font-normal">/ 15 Juta</span></h3>
                    <div className="w-full bg-stone-100 h-2 mt-2 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000", btnPrimaryClass)} style={{ width: '45%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
