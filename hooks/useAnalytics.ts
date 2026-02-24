import { useMemo } from 'react';
import { CalculatedTransaction, TransactionCategory } from '../types';
import { parseDateValue } from '../utils/formatters';

export function useAnalytics(filteredData: CalculatedTransaction[]) {
    const analyticsData = useMemo(() => {
        // 1. Pie Chart Data (Expenses by Category)
        const catMap = new Map<string, number>();
        let totalExp = 0;
        let totalInc = 0;

        filteredData.forEach(t => {
            const exp = t.actExpense || t.planExpense || 0;
            const inc = t.actIncome || t.planIncome || 0;

            if (exp > 0) {
                catMap.set(t.category, (catMap.get(t.category) || 0) + exp);
                totalExp += exp;
            }
            if (inc > 0) {
                totalInc += inc;
            }
        });
        const pieData = Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 2. Area Chart Data (Balance History)
        const areaData = filteredData.map(t => ({
            name: t.date,
            saldo: t.actBalance,
            est: t.estBalance
        }));

        // 3. Financial Health & Suggestions (Offline Logic)
        const netSavings = totalInc - totalExp;
        const savingsRate = totalInc > 0 ? (netSavings / totalInc) * 100 : 0;

        // New Metrics: Last Data Balance & Current Month Balance
        const lastActBalance = filteredData.length > 0 ? filteredData[filteredData.length - 1].actBalance : 0;

        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
        const latestTransBeforeOrInCurrentMonth = filteredData.filter(t => parseDateValue(t.date) <= endOfCurrentMonth);
        const currentMonthBalance = latestTransBeforeOrInCurrentMonth.length > 0 ? latestTransBeforeOrInCurrentMonth[latestTransBeforeOrInCurrentMonth.length - 1].actBalance : 0;
        const currentMonthEst = latestTransBeforeOrInCurrentMonth.length > 0 ? latestTransBeforeOrInCurrentMonth[latestTransBeforeOrInCurrentMonth.length - 1].estBalance : 0;

        const suggestions: { type: 'warning' | 'success' | 'info', text: string }[] = [];

        if (totalInc === 0 && totalExp === 0) {
            suggestions.push({ type: 'info', text: "Belum ada data transaksi yang cukup untuk analisis." });
        } else {
            if (netSavings < 0) {
                suggestions.push({ type: 'warning', text: "PERINGATAN DEFISIT: Pengeluaran Anda melebihi pemasukan. Segera pangkas pengeluaran gaya hidup (Wants) dan fokus pada kebutuhan pokok (Needs)." });
            } else {
                suggestions.push({ type: 'success', text: "SURPLUS: Arus kas Anda positif. Pastikan surplus ini dialokasikan ke Dana Darurat atau Investasi, bukan sekadar mengendap." });
            }

            if (savingsRate > 0 && savingsRate < 10) {
                suggestions.push({ type: 'warning', text: "RISIKO: Tingkat tabungan < 10%. Idealnya sisihkan minimal 20% pendapatan (Metode 50/30/20) untuk keamanan finansial jangka panjang." });
            } else if (savingsRate >= 20 && savingsRate < 50) {
                suggestions.push({ type: 'success', text: "SEHAT: Anda menabung > 20% pendapatan. Pertahankan kebiasaan ini untuk mencapai kebebasan finansial lebih cepat." });
            } else if (savingsRate >= 50) {
                suggestions.push({ type: 'success', text: "SANGAT SEHAT: Tingkat tabungan > 50% (Fire Movement). Anda berada di jalur cepat menuju kemandirian finansial." });
            }

            const foodExp = catMap.get('Makanan') || 0;
            if (totalExp > 0 && (foodExp / totalExp) > 0.4) {
                suggestions.push({ type: 'info', text: "BOROS MAKANAN: Pengeluaran makanan > 40%. Pertimbangkan masak sendiri atau kurangi layanan pesan-antar (GoFood/GrabFood)." });
            }

            const lifestyleExp = (catMap.get('Hiburan') || 0) + (catMap.get('Belanja') || 0);
            if (totalExp > 0 && (lifestyleExp / totalExp) > 0.3) {
                suggestions.push({ type: 'warning', text: "GAYA HIDUP TINGGI: Hiburan & Belanja > 30%. Coba terapkan 'Puasa Belanja' selama 1 minggu untuk detoks pengeluaran impulsif." });
            }

            const debtExp = (catMap.get('Cicilan') || 0);
            if (totalInc > 0 && (debtExp / totalInc) > 0.3) {
                suggestions.push({ type: 'warning', text: "BAHAYA UTANG: Rasio cicilan > 30% pendapatan. Stop ambil utang baru dan fokus lunasi utang berbunga tinggi (Metode Avalanche)." });
            }
        }

        return { pieData, areaData, totalInc, totalExp, netSavings, savingsRate, suggestions, lastActBalance, currentMonthBalance, currentMonthEst };
    }, [filteredData]);

    return analyticsData;
}
