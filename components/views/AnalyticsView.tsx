import React, { useState } from 'react';
import {
    PieChart as PieIcon, TrendingUp, TrendingDown, Sparkles,
    CheckCircle2, BarChart2, Calendar, Zap, Flame, SlidersHorizontal, X
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, AreaChart, Area,
    PieChart, Pie, ComposedChart, Line, Legend
} from 'recharts';
import { cn } from '../../utils/cn';
import { formatCurrency, parseDateValue } from '../../utils/formatters';
import { HelpButton } from '../ui/HelpButton';
import { DateRange } from '../../hooks/useAnalytics';

// ─── Category palette ─────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
    'Pemasukan': '#10b981', 'Kebutuhan Pokok': '#3b82f6', 'Tagihan': '#f59e0b',
    'Cicilan': '#ef4444', 'Hiburan': '#8b5cf6', 'Tabungan': '#14b8a6', 'Lainnya': '#78716c',
};
const CAT_LIST = Object.values(CAT_COLORS);
const catColor = (name: string, i: number) => CAT_COLORS[name] ?? CAT_LIST[i % CAT_LIST.length];

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
            {icon}{label}
        </p>
    );
}

function CurrencyTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white text-stone-800 text-xs p-3 rounded-xl shadow-xl border border-stone-100 space-y-1 min-w-[140px]">
            <p className="font-bold text-stone-500 mb-1">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-stone-500 flex-1">{p.name}:</span>
                    <span className="font-bold font-mono" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function SpendingHeatmap({ data }: { data: Record<string, number> }) {
    const WEEKS = 16;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const endSun = new Date(today);
    endSun.setDate(today.getDate() + (7 - ((dow + 6) % 7)) % 7);

    const grid: { date: Date; key: string; val: number }[][] = [];
    for (let w = WEEKS - 1; w >= 0; w--) {
        const week: { date: Date; key: string; val: number }[] = [];
        for (let d = 0; d < 7; d++) {
            const dt = new Date(endSun);
            dt.setDate(endSun.getDate() - (w * 7) - (6 - d));
            const key = dt.toISOString().slice(0, 10);
            week.push({ date: dt, key, val: data[key] ?? 0 });
        }
        grid.push(week);
    }
    const maxVal = Math.max(...Object.values(data), 1);
    const intensity = (val: number) => {
        if (val === 0) return 'bg-stone-100';
        const r = val / maxVal;
        if (r < 0.2) return 'bg-emerald-100';
        if (r < 0.4) return 'bg-emerald-300';
        if (r < 0.65) return 'bg-emerald-500';
        if (r < 0.85) return 'bg-emerald-700';
        return 'bg-emerald-900';
    };
    const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    return (
        <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
                <div className="flex flex-col gap-1 mr-1 justify-around">
                    {DAYS.map(d => <span key={d} className="text-[9px] text-stone-400 w-6 text-right leading-[11px]">{d}</span>)}
                </div>
                {grid.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                        {week.map(({ date, key, val }) => (
                            <div key={key}
                                title={`${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}: ${val > 0 ? formatCurrency(val) : 'Kosong'}`}
                                className={cn('w-[11px] h-[11px] rounded-sm transition-all cursor-default', date > today ? 'opacity-20' : intensity(val))} />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-1 mt-2 justify-end">
                <span className="text-[9px] text-stone-400">Rendah</span>
                {['bg-stone-100', 'bg-emerald-100', 'bg-emerald-300', 'bg-emerald-500', 'bg-emerald-700', 'bg-emerald-900'].map(c => (
                    <div key={c} className={cn('w-[10px] h-[10px] rounded-sm', c)} />
                ))}
                <span className="text-[9px] text-stone-400">Tinggi</span>
            </div>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AnalyticsData {
    pieData: { name: string; value: number }[];
    areaData: { name: string; saldo: number; est: number }[];
    totalInc: number; totalExp: number; netSavings: number; savingsRate: number;
    suggestions: { type: 'warning' | 'success' | 'info', text: string }[];
    lastActBalance: number; currentMonthBalance: number; currentMonthEst: number;
    monthlyTrend: { label: string; income: number; expense: number; net: number }[];
    donutData: { name: string; value: number }[];
    monthComparison: { category: string; bulanIni: number; bulanLalu: number }[];
    weeklyInsights: {
        totalThisWeek: number; totalLastWeek: number; diff: number;
        byCategory: { category: string; thisWeek: number; lastWeek: number; diff: number }[];
    };
    heatmapData: Record<string, number>;
    thisMonthLabel: string; prevMonthLabel: string;
}

interface AnalyticsViewProps {
    analyticsData: AnalyticsData;
    dateRange: DateRange;
    setDateRange: (r: DateRange) => void;
    /** Optional: hide filter bar (e.g. used inside a mobile full-screen view) */
    compact?: boolean;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AnalyticsView({ analyticsData, dateRange, setDateRange, compact = false }: AnalyticsViewProps) {
    const {
        pieData, areaData, totalInc, netSavings, savingsRate,
        suggestions, monthlyTrend, donutData, monthComparison,
        weeklyInsights, heatmapData, thisMonthLabel, prevMonthLabel,
    } = analyticsData;

    const [activeDonut, setActiveDonut] = useState<number | null>(null);
    const hasFilter = !!(dateRange.from || dateRange.to);

    // Derived metrics from already-filtered analyticsData
    const debtRatio = totalInc > 0
        ? ((pieData.find(p => p.name === 'Cicilan')?.value ?? 0) / totalInc) * 100
        : 0;
    const filteredCount = areaData.length;
    const totalDonut = donutData.reduce((s, d) => s + d.value, 0);

    return (
        <div className="h-full overflow-y-auto p-4 space-y-5 pb-8">

            {/* ── Header + Date Filter ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-center gap-2">
                    <SectionLabel icon={<Sparkles className="w-3 h-3" />} label="Analitik Keuangan" />
                    <HelpButton title="Tips Analitik" tips={[
                        { title: 'Filter Tanggal', desc: 'Gunakan filter dari-sampai untuk melihat analitik periode tertentu.' },
                        { title: 'Donut Chart', desc: 'Komposisi pengeluaran berdasarkan rentang tanggal yang dipilih.' },
                        { title: 'Tren Multi-Bulan', desc: 'Hijau = pemasukan · merah = pengeluaran · garis = net.' },
                        { title: 'Heatmap', desc: 'Warna lebih gelap = pengeluaran lebih besar pada hari tersebut.' },
                        { title: 'Insight Mingguan', desc: 'Perbandingan otomatis minggu ini vs minggu lalu.' },
                    ]} />
                </div>

                {/* Date range filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Dari</span>
                        <input type="date" value={dateRange.from}
                            onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                            className="text-[11px] font-medium text-stone-700 outline-none bg-transparent cursor-pointer w-[118px]" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sampai</span>
                        <input type="date" value={dateRange.to}
                            onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                            className="text-[11px] font-medium text-stone-700 outline-none bg-transparent cursor-pointer w-[118px]" />
                    </div>
                    {hasFilter && (
                        <button onClick={() => setDateRange({ from: '', to: '' })}
                            className="p-1.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors" title="Reset filter">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter badge */}
            {hasFilter && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-600">
                        Filter aktif — {filteredCount} transaksi · {dateRange.from || '…'} s/d {dateRange.to || '…'}
                    </span>
                </div>
            )}

            {/* ── Unique KPI Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Savings Rate',
                        color: savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 10 ? 'text-amber-600' : 'text-rose-600',
                        value: `${savingsRate.toFixed(1)}%`,
                        sub: 'Target ≥ 20%',
                        bg: savingsRate >= 20 ? 'bg-emerald-50' : savingsRate >= 10 ? 'bg-amber-50' : 'bg-rose-50',
                    },
                    {
                        label: 'Net Savings',
                        color: netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600',
                        value: formatCurrency(netSavings),
                        sub: netSavings >= 0 ? 'Surplus ✓' : 'Defisit ✗',
                        bg: netSavings >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
                    },
                    {
                        label: 'Rasio Cicilan',
                        color: debtRatio > 30 ? 'text-rose-600' : 'text-stone-800',
                        value: `${debtRatio.toFixed(1)}%`,
                        sub: 'Batas aman < 30%',
                        bg: debtRatio > 30 ? 'bg-rose-50' : 'bg-stone-50',
                    },
                    {
                        label: 'Total Transaksi',
                        color: 'text-indigo-600',
                        value: `${filteredCount}`,
                        sub: hasFilter ? 'Periode dipilih' : 'Semua data',
                        bg: 'bg-indigo-50',
                    },
                ].map((c, i) => (
                    <div key={i} className={cn('p-4 rounded-xl border border-stone-200 shadow-sm', c.bg)}>
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">{c.label}</p>
                        <h3 className={cn('text-xl font-bold font-mono', c.color)}>{c.value}</h3>
                        <p className="text-[9px] text-stone-400 mt-0.5">{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Row 1: Donut + Area ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* 🥧 Donut */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                    <div className="mb-3">
                        <SectionLabel icon={<PieIcon className="w-3 h-3" />} label="Komposisi Pengeluaran" />
                        <p className="text-[10px] text-stone-400 mt-0.5">{hasFilter ? `${dateRange.from || '…'} – ${dateRange.to || '…'}` : thisMonthLabel}</p>
                    </div>
                    {donutData.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-stone-300 text-xs">Belum ada data pengeluaran</div>
                    ) : (
                        <div className="flex gap-4 items-center">
                            <div className="w-40 h-40 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={60}
                                            paddingAngle={3} dataKey="value"
                                            onMouseEnter={(_, i) => setActiveDonut(i)} onMouseLeave={() => setActiveDonut(null)}>
                                            {donutData.map((e, i) => (
                                                <Cell key={i} fill={catColor(e.name, i)} opacity={activeDonut === null || activeDonut === i ? 1 : 0.35} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CurrencyTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-1.5 min-w-0">
                                {donutData.slice(0, 6).map((d, i) => (
                                    <div key={i} onMouseEnter={() => setActiveDonut(i)} onMouseLeave={() => setActiveDonut(null)}
                                        className={cn('flex items-center gap-2 text-[10px] cursor-default transition-opacity', activeDonut !== null && activeDonut !== i ? 'opacity-35' : '')}>
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor(d.name, i) }} />
                                        <span className="text-stone-600 truncate flex-1">{d.name}</span>
                                        <span className="font-bold text-stone-800 font-mono shrink-0">{totalDonut > 0 ? ((d.value / totalDonut) * 100).toFixed(0) : 0}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Area chart */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 flex flex-col">
                    <SectionLabel icon={<TrendingUp className="w-3 h-3" />} label="Pertumbuhan Saldo" />
                    <div className="flex-1 min-h-[160px] mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#a8a29e' }} tickLine={false} axisLine={false}
                                    tickFormatter={v => { try { const d = new Date(parseDateValue(v)); return `${d.getDate()}/${d.getMonth() + 1}`; } catch { return ''; } }}
                                    minTickGap={30} />
                                <YAxis tick={{ fontSize: 9, fill: '#a8a29e' }} tickLine={false} axisLine={false}
                                    tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CurrencyTooltip />} />
                                <Area type="monotone" dataKey="saldo" name="Aktual" stroke="#10b981" strokeWidth={2} fill="url(#gS)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                <Area type="monotone" dataKey="est" name="Estimasi" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── 📉 Tren Multi-Bulan ─────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <SectionLabel icon={<BarChart2 className="w-3 h-3" />} label="Tren Pengeluaran vs Pemasukan" />
                <p className="text-[10px] text-stone-400 mt-0.5 mb-4">Hijau = pemasukan · Merah = pengeluaran · Garis = net</p>
                {monthlyTrend.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-stone-300 text-xs">Belum ada data multi-bulan</div>
                ) : (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyTrend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#a8a29e' }} tickLine={false} axisLine={false}
                                    tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CurrencyTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 10, color: '#78716c' }} />
                                <Bar dataKey="income" name="Pemasukan" fill="#10b981" opacity={0.85} radius={[3, 3, 0, 0]} barSize={16} />
                                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" opacity={0.85} radius={[3, 3, 0, 0]} barSize={16} />
                                <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ── Row 2: Bulan vs Bulan + Weekly Insight ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* 📆 Bulan vs Bulan */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                    <SectionLabel icon={<Calendar className="w-3 h-3" />} label="Bulan vs Bulan" />
                    <div className="flex gap-3 mt-0.5 mb-3">
                        <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold"><div className="w-2 h-2 rounded-sm bg-emerald-400" />{thisMonthLabel}</span>
                        <span className="flex items-center gap-1 text-[9px] text-stone-400 font-bold"><div className="w-2 h-2 rounded-sm bg-stone-300" />{prevMonthLabel}</span>
                    </div>
                    {monthComparison.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-stone-300 text-xs">Belum ada data perbandingan</div>
                    ) : (
                        <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthComparison} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: '#78716c' }} width={72} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CurrencyTooltip />} />
                                    <Bar dataKey="bulanIni" name="Bulan Ini" fill="#10b981" radius={[0, 3, 3, 0]} barSize={8} opacity={0.9} />
                                    <Bar dataKey="bulanLalu" name="Bulan Lalu" fill="#d1d5db" radius={[0, 3, 3, 0]} barSize={8} opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* 🏆 Weekly Insight */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                    <SectionLabel icon={<Zap className="w-3 h-3" />} label="Spending Insight Mingguan" />
                    <div className="mt-3 space-y-2">
                        <div className={cn('flex items-center justify-between p-3 rounded-xl border',
                            weeklyInsights.diff <= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100')}>
                            <div>
                                <p className="text-[10px] font-bold text-stone-500">Minggu Ini</p>
                                <p className={cn('text-lg font-bold font-mono', weeklyInsights.diff <= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                                    {formatCurrency(weeklyInsights.totalThisWeek)}
                                </p>
                            </div>
                            <div className="text-right">
                                {weeklyInsights.diff < 0 ? (
                                    <><TrendingDown className="w-4 h-4 text-emerald-500 ml-auto mb-0.5" />
                                        <p className="text-[10px] font-bold text-emerald-600">Hemat {formatCurrency(Math.abs(weeklyInsights.diff))}</p>
                                        <p className="text-[9px] text-stone-400">vs minggu lalu</p></>
                                ) : weeklyInsights.diff > 0 ? (
                                    <><TrendingUp className="w-4 h-4 text-rose-500 ml-auto mb-0.5" />
                                        <p className="text-[10px] font-bold text-rose-600">+{formatCurrency(weeklyInsights.diff)}</p>
                                        <p className="text-[9px] text-stone-400">vs minggu lalu</p></>
                                ) : <p className="text-[10px] text-stone-400">Sama dengan<br />minggu lalu</p>}
                            </div>
                        </div>
                        {weeklyInsights.byCategory.length === 0 ? (
                            <p className="text-[10px] text-stone-400 text-center py-4">Belum ada transaksi aktual minggu ini</p>
                        ) : weeklyInsights.byCategory.map((cat, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                                <span className="text-stone-600 flex-1">{cat.category}</span>
                                <span className="font-mono text-stone-700">{formatCurrency(cat.thisWeek)}</span>
                                <span className={cn('font-bold w-16 text-right', cat.diff < 0 ? 'text-emerald-500' : cat.diff > 0 ? 'text-rose-500' : 'text-stone-400')}>
                                    {cat.diff < 0 ? '▼' : cat.diff > 0 ? '▲' : '–'} {formatCurrency(Math.abs(cat.diff))}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 🔥 Heatmap ─────────────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <div className="mb-4">
                    <SectionLabel icon={<Flame className="w-3 h-3" />} label="Heatmap Pengeluaran Harian" />
                    <p className="text-[10px] text-stone-400 mt-0.5">16 minggu terakhir — hover tiap sel untuk detail</p>
                </div>
                <SpendingHeatmap data={heatmapData} />
            </div>

            {/* ── Total per Kategori ──────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <SectionLabel icon={<BarChart2 className="w-3 h-3" />} label="Total Pengeluaran per Kategori" />
                <div className="mt-3" style={{ height: Math.max(180, pieData.length * 36) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={pieData} margin={{ top: 0, right: 24, left: 48, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#57534e' }} width={88} axisLine={false} tickLine={false} />
                            <Tooltip content={<CurrencyTooltip />} />
                            <Bar dataKey="value" name="Total" radius={[0, 4, 4, 0]} barSize={20}>
                                {pieData.map((e, i) => <Cell key={i} fill={catColor(e.name, i)} opacity={0.85} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── AI Suggestions ─────────────────────────────────────────── */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />Analisis & Saran Keuangan
                </h3>
                <div className="space-y-2">
                    {suggestions.map((s, i) => (
                        <div key={i} className={cn('p-3 rounded-xl border flex gap-3 items-start',
                            s.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                s.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                    'bg-blue-50 border-blue-100 text-blue-800')}>
                            {s.type === 'warning' ? <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" /> :
                                s.type === 'success' ? <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" /> :
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                            <p className="leading-relaxed font-medium text-xs">{s.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
