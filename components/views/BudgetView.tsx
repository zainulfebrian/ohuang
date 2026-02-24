import React, { useState } from 'react';
import {
    Target, AlertTriangle, CheckCircle2, Save, X,
    ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Circle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CategoryBudget, CalculatedTransaction } from '../../types';
import { formatCurrency, parseDateValue } from '../../utils/formatters';
import { HelpButton } from '../ui/HelpButton';

interface BudgetViewProps {
    budgets: CategoryBudget[];
    filteredData: CalculatedTransaction[];
    updateBudget: (category: string, limit: number) => void;
    currentMonthYear: string;
    handlePrevMonth?: () => void;
    handleNextMonth?: () => void;
    monthNames: string[];
}

// ─── SVG ring progress ────────────────────────────────────────────────────────
function RingProgress({ percent, color, size = 56 }: { percent: number; color: string; size?: number }) {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(percent / 100, 1) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={6} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
        </svg>
    );
}

export function BudgetView({ budgets, filteredData, updateBudget, currentMonthYear, handlePrevMonth, handleNextMonth, monthNames }: BudgetViewProps) {
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editVal, setEditVal] = useState('');

    const spending = React.useMemo(() => {
        const map: Record<string, number> = {};
        filteredData.forEach(t => {
            const d = new Date(parseDateValue(t.date));
            if (`${monthNames[d.getMonth()]} ${d.getFullYear()}` !== currentMonthYear) return;
            const amt = t.actExpense || t.planExpense || 0;
            if (amt > 0) {
                const k = t.category.trim().toLowerCase();
                map[k] = (map[k] || 0) + amt;
            }
        });
        return map;
    }, [filteredData, currentMonthYear, monthNames]);

    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (spending[b.category.toLowerCase().trim()] || 0), 0);
    const overCount = budgets.filter(b => { const sp = spending[b.category.toLowerCase().trim()] || 0; return b.limit > 0 && sp > b.limit; }).length;
    const safeCount = budgets.filter(b => { const sp = spending[b.category.toLowerCase().trim()] || 0; return b.limit > 0 && sp <= b.limit * 0.8; }).length;

    return (
        <div className="h-full overflow-y-auto p-4 space-y-5 pb-8">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-stone-800">Anggaran & Goals</h2>
                        <HelpButton title="Tips Anggaran" tips={[
                            { title: 'Set Limit', desc: 'Klik ikon pensil di setiap kartu untuk mengatur batas anggaran per kategori.' },
                            { title: 'Progress Ring', desc: 'Lingkaran di setiap kartu menunjukkan persentase anggaran yang sudah terpakai.' },
                            { title: 'Warna Status', desc: '🟢 Aman (<80%) · 🟡 Peringatan (80-100%) · 🔴 Overbudget (>100%)' },
                            { title: 'Navigasi Bulan', desc: 'Gunakan tombol panah untuk melihat anggaran bulan lain.' },
                            { title: 'Tips Anggaran', desc: 'Gunakan aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan.' },
                        ]} />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">Pantau dan kendalikan pengeluaran per kategori</p>
                </div>

                {/* Month nav */}
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm shrink-0">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100/50 min-w-[130px] text-center">
                        <span className="text-[11px] font-bold text-indigo-700">{currentMonthYear}</span>
                    </div>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-400 hover:text-stone-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Summary bar ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Anggaran', value: formatCurrency(totalBudget), color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                    { label: 'Terpakai', value: formatCurrency(totalSpent), color: totalSpent > totalBudget ? 'text-rose-600' : 'text-stone-800', bg: totalSpent > totalBudget ? 'bg-rose-50 border-rose-100' : 'bg-white border-stone-200' },
                    { label: 'Sisa Anggaran', value: formatCurrency(Math.max(0, totalBudget - totalSpent)), color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                ].map((c, i) => (
                    <div key={i} className={cn('p-3 rounded-xl border shadow-sm', c.bg)}>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">{c.label}</p>
                        <p className={cn('text-sm font-bold font-mono', c.color)}>{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Status pills */}
            {(overCount > 0 || safeCount > 0) && (
                <div className="flex gap-2 flex-wrap">
                    {overCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 rounded-full px-3 py-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span className="text-[10px] font-bold text-rose-600">{overCount} kategori overbudget</span>
                        </div>
                    )}
                    {safeCount > 0 && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600">{safeCount} kategori aman</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Budget Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map(budget => {
                    const key = budget.category.toLowerCase().trim();
                    const sp = spending[key] || 0;
                    const lim = budget.limit;
                    const pct = lim > 0 ? (sp / lim) * 100 : 0;
                    const over = lim > 0 && sp > lim;
                    const warn = lim > 0 && pct >= 80 && !over;
                    const safe = lim > 0 && pct < 80;

                    const ringColor = over ? '#ef4444' : warn ? '#f59e0b' : lim > 0 ? '#10b981' : '#e7e5e4';
                    const statusBg = over ? 'bg-rose-50 border-rose-100 text-rose-600'
                        : warn ? 'bg-amber-50 border-amber-100 text-amber-600'
                            : safe ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-stone-50 border-stone-200 text-stone-400';

                    return (
                        <div key={budget.category} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform duration-200">
                            {/* Top accent */}
                            <div className={cn('h-1', over ? 'bg-rose-400' : warn ? 'bg-amber-400' : lim > 0 ? 'bg-emerald-400' : 'bg-stone-200')} />

                            <div className="p-4 flex flex-col gap-3 flex-1">
                                {/* Category + ring */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">{budget.category}</span>
                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-xl font-bold text-stone-800 font-mono">{formatCurrency(sp)}</span>
                                            {lim > 0 && <span className="text-[10px] text-stone-400">/ {formatCurrency(lim)}</span>}
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <RingProgress percent={pct} color={ringColor} />
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-stone-600 rotate-90">
                                            {lim > 0 ? `${Math.min(pct, 999).toFixed(0)}%` : '–'}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all duration-700', over ? 'bg-rose-500' : warn ? 'bg-amber-400' : 'bg-emerald-400')}
                                        style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>

                                {/* Status badge */}
                                {lim > 0 && (
                                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium', statusBg)}>
                                        {over ? <><AlertTriangle className="w-3 h-3 shrink-0" /><span>Overbudget {formatCurrency(sp - lim)}</span></>
                                            : <><CheckCircle2 className="w-3 h-3 shrink-0" /><span>Sisa: {formatCurrency(lim - sp)}</span></>}
                                    </div>
                                )}
                                {lim === 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[10px] text-stone-400">
                                        <Circle className="w-3 h-3 shrink-0" />
                                        <span>Belum ada batas anggaran</span>
                                    </div>
                                )}
                            </div>

                            {/* Edit form */}
                            {editingCat === budget.category ? (
                                <div className="px-4 pb-4 pt-0 animate-fade-in">
                                    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-2 border border-stone-200">
                                        <span className="text-xs font-bold text-stone-400 pl-1">Rp</span>
                                        <input autoFocus type="number" value={editVal}
                                            onChange={e => setEditVal(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (updateBudget(budget.category, Number(editVal) || 0), setEditingCat(null))}
                                            className="flex-1 bg-transparent outline-none text-sm font-bold text-stone-700 min-w-0"
                                            placeholder="Masukkan limit..." />
                                        <button onClick={() => { updateBudget(budget.category, Number(editVal) || 0); setEditingCat(null); }}
                                            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors active:scale-95">
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setEditingCat(null)}
                                            className="p-1.5 bg-white border border-stone-200 text-stone-400 rounded-lg hover:bg-stone-50 transition-colors">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => { setEditingCat(budget.category); setEditVal(budget.limit.toString()); }}
                                    className="flex items-center justify-center gap-1.5 py-2.5 border-t border-stone-100 text-[10px] font-bold text-stone-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors">
                                    <Target className="w-3 h-3" />
                                    {lim > 0 ? 'Ubah Batas Anggaran' : 'Set Batas Anggaran'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Tip box ─────────────────────────────────────────────────── */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <TrendingDown className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[11px] font-bold text-indigo-700 mb-0.5">Metode 50/30/20</p>
                    <p className="text-[10px] text-indigo-600 leading-relaxed">
                        Alokasikan <strong>50%</strong> untuk kebutuhan pokok (tagihan, cicilan, makanan), <strong>30%</strong> untuk keinginan (hiburan, belanja), dan <strong>20%</strong> untuk tabungan & investasi.
                    </p>
                </div>
            </div>
        </div>
    );
}
