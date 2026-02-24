import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, CalendarDays, Banknote } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';
import { HelpButton } from '../ui/HelpButton';

interface MonthlyTotals {
    actIncome: number;
    actExpense: number;
    estIncome: number;
    estExpense: number;
    monthLabel: string;
}

interface SummaryCardsProps {
    totals: {
        finalEstBalance: number;
        finalActBalance: number;
        periodIncome: number;
        periodExpense: number;
    };
    monthlyTotals: MonthlyTotals;
}

export function SummaryCards({ totals, monthlyTotals }: SummaryCardsProps) {
    const actNet = monthlyTotals.actIncome - monthlyTotals.actExpense;
    const estNet = monthlyTotals.estIncome - monthlyTotals.estExpense;
    const isPositive = totals.finalActBalance >= 0;
    const expenseRatio = Math.min((totals.periodExpense / (totals.periodIncome || 1)) * 100, 100);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-stone-50 shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Card 1: Total Balance */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-200 animate-bounce-in stagger-1">
                    {/* BG icon */}
                    <div className="absolute -right-3 -top-3 p-5 opacity-[0.06]">
                        <Banknote className="w-16 h-16 text-stone-800" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sisa Saldo Aktual</p>
                        <div className="flex items-center gap-1.5">
                            <HelpButton
                                title="Sisa Saldo Aktual"
                                tips={[
                                    { title: 'Apa ini?', desc: 'Total saldo bersih aktual dari semua transaksi yang sudah terjadi.' },
                                    { title: 'Kolom Aktual', desc: 'Dihitung dari kolom Akt Masuk dikurangi Akt Keluar secara kumulatif.' },
                                    { title: 'Est (Estimasi)', desc: 'Saldo yang seharusnya berdasarkan rencana (Renc Masuk - Renc Keluar).' },
                                    { title: 'Merah = Defisit', desc: 'Jika angka merah, pengeluaran melebihi pemasukan. Segera evaluasi.' },
                                ]}
                            />
                            <div className={cn("p-1.5 rounded-lg", isPositive ? "bg-emerald-50" : "bg-rose-50")}>
                                {isPositive
                                    ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    : <TrendingDown className="w-4 h-4 text-rose-500" />
                                }
                            </div>
                        </div>
                    </div>
                    <h3 className={cn("text-2xl font-black mt-1 tracking-tight", isPositive ? "text-stone-800" : "text-rose-600")}>
                        {formatCurrency(totals.finalActBalance)}
                    </h3>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-400">
                        <span className="font-medium">Est:</span>
                        <span className="font-bold text-stone-500">{formatCurrency(totals.finalEstBalance)}</span>
                    </div>
                </div>

                {/* Card 2: Income vs Expense */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:-translate-y-0.5 transition-all duration-200 animate-bounce-in stagger-2">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Rekapitulasi</p>
                        <HelpButton
                            title="Rekapitulasi Transaksi"
                            tips={[
                                { title: 'Masuk (Pemasukan)', desc: 'Total seluruh Akt Masuk dari semua transaksi yang tercatat.' },
                                { title: 'Keluar (Pengeluaran)', desc: 'Total seluruh Akt Keluar dari semua transaksi yang tercatat.' },
                                { title: 'Progress Bar', desc: 'Menunjukkan rasio pengeluaran vs pemasukan. Merah jika sudah di atas 80%.' },
                                { title: 'Filter Periode', desc: 'Gunakan fitur filter tanggal di tabel untuk melihat rekapitulasi per periode.' },
                            ]}
                        />
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg">
                                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Masuk</p>
                                <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodIncome)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-50 rounded-lg">
                                <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Keluar</p>
                                <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodExpense)}</p>
                            </div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1">
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-rose-400 to-rose-500"
                                style={{ width: `${expenseRatio}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-stone-400 text-right font-medium">{expenseRatio.toFixed(0)}% terpakai</p>
                    </div>
                </div>

                {/* Card 3: Bulan Ini */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden hover:-translate-y-0.5 transition-all duration-200 animate-bounce-in stagger-3">
                    <div className="absolute -right-3 -top-3 p-5 opacity-[0.05]">
                        <CalendarDays className="w-16 h-16 text-indigo-600" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider capitalize">
                            {monthlyTotals.monthLabel}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <HelpButton
                                title="Ringkasan Bulan Ini"
                                tips={[
                                    { title: 'Net Bulan Ini', desc: 'Selisih antara pemasukan dan pengeluaran aktual pada bulan berjalan.' },
                                    { title: 'Estimasi', desc: 'Rencana pemasukan dikurangi rencana pengeluaran bulan ini.' },
                                    { title: '↑ Masuk / ↓ Keluar', desc: 'Total aktual pemasukan dan pengeluaran bulan ini secara terpisah.' },
                                    { title: 'Bulan berjalan', desc: 'Otomatis mengikuti bulan saat ini berdasarkan kolom tanggal.' },
                                ]}
                            />
                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <CalendarDays className="w-4 h-4 text-indigo-500" />
                            </div>
                        </div>
                    </div>
                    <h3 className={cn("text-2xl font-black mt-1 tracking-tight", actNet < 0 ? "text-rose-600" : "text-stone-800")}>
                        {actNet >= 0 ? '+' : ''}{formatCurrency(actNet)}
                    </h3>
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-[10px] text-stone-400">
                            Est: <span className={cn("font-bold", estNet < 0 ? "text-rose-400" : "text-indigo-500")}>
                                {estNet >= 0 ? '+' : ''}{formatCurrency(estNet)}
                            </span>
                        </span>
                        <div className="flex gap-2 text-[9px] font-bold">
                            <span className="text-emerald-500">↑ {formatCurrency(monthlyTotals.actIncome)}</span>
                            <span className="text-rose-500">↓ {formatCurrency(monthlyTotals.actExpense)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
