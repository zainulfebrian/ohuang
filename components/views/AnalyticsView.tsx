import React from 'react';
import { PieChart as PieIcon, TrendingUp, TrendingDown, Sparkles, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { cn } from '../../utils/cn';
import { formatCurrency, parseDateValue } from '../../utils/formatters';
import { CATEGORIES } from '../../constants';

interface AnalyticsViewProps {
    analyticsData: {
        pieData: { name: string; value: number }[];
        areaData: { name: string; saldo: number; est: number }[];
        totalInc: number;
        totalExp: number;
        netSavings: number;
        savingsRate: number;
        suggestions: { type: 'warning' | 'success' | 'info', text: string }[];
        lastActBalance: number;
        currentMonthBalance: number;
        currentMonthEst: number;
    };
}

export function AnalyticsView({ analyticsData }: AnalyticsViewProps) {
    return (
        <div className="h-full overflow-y-auto p-4 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Total Pemasukan</p>
                    <h3 className="text-xl font-bold text-emerald-600">{formatCurrency(analyticsData.totalInc)}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Total Pengeluaran</p>
                    <h3 className="text-xl font-bold text-rose-600">{formatCurrency(analyticsData.totalExp)}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Saldo Aktual (Data Terakhir)</p>
                    <h3 className={cn("text-xl font-bold", analyticsData.lastActBalance >= 0 ? "text-stone-800" : "text-rose-600")}>
                        {formatCurrency(analyticsData.lastActBalance)}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
                    <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Saldo Bulan Ini ({new Date().toLocaleString('id-ID', { month: 'short' })})</p>
                    <h3 className={cn("text-xl font-bold", analyticsData.currentMonthBalance >= 0 ? "text-indigo-600" : "text-rose-600")}>
                        {formatCurrency(analyticsData.currentMonthBalance)}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1">Est: {formatCurrency(analyticsData.currentMonthEst)}</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart (Expenses by Category) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col h-[400px]">
                    <h3 className="text-sm font-bold text-stone-700 mb-6 flex items-center gap-2">
                        <PieIcon className="w-4 h-4 text-stone-400" />
                        Pengeluaran per Kategori
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={analyticsData.pieData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f4" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#57534e', fontWeight: 500 }}
                                    width={80}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-stone-900 text-white text-xs p-2 rounded-lg shadow-xl border border-stone-700">
                                                    <p className="font-bold mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-emerald-400 font-mono">{formatCurrency(payload[0].value as number)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {analyticsData.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORIES.find(c => c.name === entry.name)?.color ? '#6366f1' : '#a855f7'} className="opacity-80 hover:opacity-100 transition-opacity" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Area Chart (Balance Growth) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex flex-col h-[400px]">
                    <h3 className="text-sm font-bold text-stone-700 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-stone-400" />
                        Pertumbuhan Saldo
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#64748b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 10, fill: '#a8a29e' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        const d = new Date(parseDateValue(val));
                                        return `${d.getDate()}/${d.getMonth() + 1}`;
                                    }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#a8a29e' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white text-stone-800 text-xs p-3 rounded-xl shadow-xl border border-stone-100">
                                                    <p className="font-bold mb-2 text-stone-500">{label}</p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            <span className="text-stone-500">Aktual:</span>
                                                            <span className="font-bold font-mono text-emerald-600">{formatCurrency(payload[0].value as number)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                                                            <span className="text-stone-500">Estimasi:</span>
                                                            <span className="font-bold font-mono text-stone-600">{formatCurrency(payload[1].value as number)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="saldo"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorSaldo)"
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="est"
                                    stroke="#94a3b8"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    fillOpacity={1}
                                    fill="url(#colorEst)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Suggestions Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
                <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Analisis & Saran Keuangan (Offline AI)
                </h3>
                <div className="space-y-3">
                    {analyticsData.suggestions.map((s, i) => (
                        <div key={i} className={cn(
                            "p-4 rounded-lg border flex gap-3 items-start",
                            s.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-800" :
                                s.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                                    "bg-blue-50 border-blue-200 text-blue-800"
                        )}>
                            {s.type === 'warning' ? <TrendingDown className="w-5 h-5 shrink-0 mt-0.5" /> :
                                s.type === 'success' ? <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" /> :
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                            <p className="text-sm leading-relaxed font-medium">{s.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
