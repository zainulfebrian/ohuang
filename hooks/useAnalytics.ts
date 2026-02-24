import { useMemo } from 'react';
import { CalculatedTransaction } from '../types';
import { parseDateValue } from '../utils/formatters';

export interface DateRange { from: string; to: string; }

export function useAnalytics(
    filteredData: CalculatedTransaction[],
    allData: CalculatedTransaction[] = [],
    dateRange?: DateRange,
) {
    const analyticsData = useMemo(() => {
        // Apply date range filter when set
        const applyRange = (data: CalculatedTransaction[]) => {
            if (!dateRange?.from && !dateRange?.to) return data;
            return data.filter(t => {
                try {
                    const ts = parseDateValue(t.date);
                    const from = dateRange.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : -Infinity;
                    const to = dateRange.to ? new Date(dateRange.to).setHours(23, 59, 59, 999) : Infinity;
                    return ts >= from && ts <= to;
                } catch { return true; }
            });
        };

        const src = applyRange(allData.length > 0 ? allData : filteredData);
        const base = applyRange(filteredData); // for areaData (keeps running balance context)


        // ─── 1. Pie / Category map ────────────────────────────────────────────
        const catMap = new Map<string, number>();
        let totalExp = 0, totalInc = 0;
        base.forEach(t => {
            const exp = t.actExpense || t.planExpense || 0;
            const inc = t.actIncome || t.planIncome || 0;
            if (exp > 0) { catMap.set(t.category, (catMap.get(t.category) || 0) + exp); totalExp += exp; }
            if (inc > 0) totalInc += inc;
        });
        const pieData = Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // ─── 2. Area chart (balance history) ─────────────────────────────────
        const areaData = base.map(t => ({ name: t.date, saldo: t.actBalance, est: t.estBalance }));


        // ─── 3. Financial health metrics ─────────────────────────────────────
        const netSavings = totalInc - totalExp;
        const savingsRate = totalInc > 0 ? (netSavings / totalInc) * 100 : 0;
        const lastActBalance = base.length > 0 ? base[base.length - 1].actBalance : 0;

        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
        const upToNow = base.filter(t => parseDateValue(t.date) <= endOfCurrentMonth);
        const currentMonthBalance = upToNow.length > 0 ? upToNow[upToNow.length - 1].actBalance : 0;
        const currentMonthEst = upToNow.length > 0 ? upToNow[upToNow.length - 1].estBalance : 0;

        // ─── 4. AI Suggestions ───────────────────────────────────────────────
        const suggestions: { type: 'warning' | 'success' | 'info', text: string }[] = [];
        if (totalInc === 0 && totalExp === 0) {
            suggestions.push({ type: 'info', text: 'Belum ada data transaksi yang cukup untuk analisis.' });
        } else {
            if (netSavings < 0)
                suggestions.push({ type: 'warning', text: 'PERINGATAN DEFISIT: Pengeluaran melebihi pemasukan. Segera pangkas pengeluaran gaya hidup dan fokus pada kebutuhan pokok.' });
            else
                suggestions.push({ type: 'success', text: 'SURPLUS: Arus kas positif. Alokasikan surplus ke Dana Darurat atau Investasi, jangan biarkan mengendap.' });
            if (savingsRate > 0 && savingsRate < 10)
                suggestions.push({ type: 'warning', text: 'RISIKO: Tingkat tabungan < 10%. Idealnya sisihkan minimal 20% pendapatan (Metode 50/30/20).' });
            else if (savingsRate >= 20 && savingsRate < 50)
                suggestions.push({ type: 'success', text: 'SEHAT: Anda menabung > 20% pendapatan. Pertahankan kebiasaan ini.' });
            else if (savingsRate >= 50)
                suggestions.push({ type: 'success', text: 'SANGAT SEHAT: Tingkat tabungan > 50% (FIRE Movement). Jalur cepat menuju kemandirian finansial.' });
            const debtExp = catMap.get('Cicilan') || 0;
            if (totalInc > 0 && debtExp / totalInc > 0.3)
                suggestions.push({ type: 'warning', text: 'BAHAYA UTANG: Rasio cicilan > 30% pendapatan. Stop ambil utang baru, fokus lunasi berbunga tinggi (Metode Avalanche).' });
            const lifestyle = (catMap.get('Hiburan') || 0) + (catMap.get('Lainnya') || 0);
            if (totalExp > 0 && lifestyle / totalExp > 0.3)
                suggestions.push({ type: 'warning', text: "GAYA HIDUP TINGGI: Hiburan & Lainnya > 30%. Coba terapkan 'Puasa Belanja' selama 1 minggu." });
        }

        // ─── NEW 1. Monthly Trend: income / expense / net per month ──────────
        const monthMap = new Map<string, { label: string; income: number; expense: number }>();
        src.forEach(t => {
            try {
                const d = new Date(parseDateValue(t.date));
                if (isNaN(d.getTime())) return;
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!monthMap.has(key)) {
                    monthMap.set(key, {
                        label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
                        income: 0, expense: 0,
                    });
                }
                const m = monthMap.get(key)!;
                m.income += t.actIncome || t.planIncome || 0;
                m.expense += t.actExpense || t.planExpense || 0;
            } catch { }
        });
        const monthlyTrend = Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => ({ ...v, net: v.income - v.expense }));

        // ─── NEW 2. Current month Donut ───────────────────────────────────────
        const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        const prevMonthLabel = prevMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const catThis = new Map<string, number>();
        const catPrev = new Map<string, number>();
        src.forEach(t => {
            try {
                const d = new Date(parseDateValue(t.date));
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const exp = t.actExpense || t.planExpense || 0;
                if (exp <= 0) return;
                if (key === thisMonthKey) catThis.set(t.category, (catThis.get(t.category) || 0) + exp);
                if (key === prevMonthKey) catPrev.set(t.category, (catPrev.get(t.category) || 0) + exp);
            } catch { }
        });

        const donutData = Array.from(catThis.entries())
            .map(([name, value]) => ({ name, value }))
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);

        // ─── NEW 3. Month-vs-Month comparison per category ────────────────────
        const allCats = new Set([...catThis.keys(), ...catPrev.keys()]);
        const monthComparison = Array.from(allCats)
            .map(cat => ({
                category: (cat && cat.length > 10) ? cat.slice(0, 10) + '…' : (cat || 'Lainnya'),
                bulanIni: catThis.get(cat) || 0,
                bulanLalu: catPrev.get(cat) || 0,
            }))
            .sort((a, b) => (b.bulanIni + b.bulanLalu) - (a.bulanIni + a.bulanLalu));

        // ─── NEW 4. Weekly Insight ────────────────────────────────────────────
        const dow = now.getDay();
        const startThisWeek = new Date(now);
        startThisWeek.setDate(now.getDate() - ((dow + 6) % 7));
        startThisWeek.setHours(0, 0, 0, 0);
        const startLastWeek = new Date(startThisWeek);
        startLastWeek.setDate(startThisWeek.getDate() - 7);

        const thisWeekCat = new Map<string, number>();
        const lastWeekCat = new Map<string, number>();
        src.forEach(t => {
            try {
                const ts = parseDateValue(t.date);
                const exp = t.actExpense || 0;
                if (exp <= 0) return;
                if (ts >= startThisWeek.getTime()) {
                    thisWeekCat.set(t.category, (thisWeekCat.get(t.category) || 0) + exp);
                } else if (ts >= startLastWeek.getTime()) {
                    lastWeekCat.set(t.category, (lastWeekCat.get(t.category) || 0) + exp);
                }
            } catch { }
        });
        const totalThisWeek = Array.from(thisWeekCat.values()).reduce((a, b) => a + b, 0);
        const totalLastWeek = Array.from(lastWeekCat.values()).reduce((a, b) => a + b, 0);
        const allWeekCats = new Set([...thisWeekCat.keys(), ...lastWeekCat.keys()]);
        const weeklyInsights = {
            totalThisWeek,
            totalLastWeek,
            diff: totalThisWeek - totalLastWeek,
            byCategory: Array.from(allWeekCats)
                .map(cat => ({
                    category: cat,
                    thisWeek: thisWeekCat.get(cat) || 0,
                    lastWeek: lastWeekCat.get(cat) || 0,
                    diff: (thisWeekCat.get(cat) || 0) - (lastWeekCat.get(cat) || 0),
                }))
                .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
                .slice(0, 5),
        };

        // ─── NEW 5. Spending Heatmap (expense per day, last 16 weeks) ─────────
        const heatmapData: Record<string, number> = {};
        src.forEach(t => {
            try {
                const d = new Date(parseDateValue(t.date));
                if (isNaN(d.getTime())) return;
                const exp = t.actExpense || t.planExpense || 0;
                if (exp <= 0) return;
                const key = d.toISOString().slice(0, 10);
                heatmapData[key] = (heatmapData[key] || 0) + exp;
            } catch { }
        });

        return {
            // existing
            pieData, areaData, totalInc, totalExp, netSavings, savingsRate,
            suggestions, lastActBalance, currentMonthBalance, currentMonthEst,
            // new
            monthlyTrend, donutData, monthComparison, weeklyInsights, heatmapData,
            thisMonthLabel, prevMonthLabel,
        };
    }, [filteredData, allData]);

    return analyticsData;
}
