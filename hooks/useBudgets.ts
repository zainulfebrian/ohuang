import { useState, useEffect, useMemo } from 'react';
import { CategoryBudget } from '../types';
import { CATEGORIES } from '../constants';

export function useBudgets(currentMonthYear: string) {
    const [allBudgets, setAllBudgets] = useState<CategoryBudget[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ohmonsea_budgets_v2');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setAllBudgets(parsed);
                }
            } catch (e) {
                console.error("Failed to parse budgets", e);
            }
        }
        setLoading(false);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('ohmonsea_budgets_v2', JSON.stringify(allBudgets));
        }
    }, [allBudgets, loading]);

    // Get budgets for current month, or initialize if not exist
    const budgets = useMemo(() => {
        // Filter saved budgets for this month
        const monthlySaved = allBudgets.filter(b => b.monthYear === currentMonthYear);

        // Always derive the full list from CATEGORIES to maintain order and completeness
        return CATEGORIES
            .filter(c => c.name !== 'Pemasukan')
            .map(c => {
                const saved = monthlySaved.find(s => s.category === c.name);
                return {
                    category: c.name,
                    limit: saved ? saved.limit : 0,
                    monthYear: currentMonthYear
                };
            });
    }, [allBudgets, currentMonthYear]);

    const updateBudget = (category: string, limit: number) => {
        const cleanCategory = category.trim();
        setAllBudgets(prev => {
            // Find if we already have an entry for this category AND month
            const index = prev.findIndex(b =>
                b.category.trim() === cleanCategory &&
                b.monthYear === currentMonthYear
            );

            if (index > -1) {
                // Update existing
                const updated = [...prev];
                updated[index] = { ...updated[index], limit };
                return updated;
            } else {
                // Add new entry for this month
                return [...prev, { category: cleanCategory, limit, monthYear: currentMonthYear }];
            }
        });
    };

    const resetBudgets = () => {
        setAllBudgets(prev => prev.filter(b => b.monthYear !== currentMonthYear));
    };

    return { budgets, updateBudget, resetBudgets, loading };
}
