import { useState, useEffect, useMemo } from 'react';
import { Transaction, CalculatedTransaction } from '../types';
import { parseDateValue, formatCurrency } from '../utils/formatters';

export function useTransactions(searchQuery: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [groupBy, setGroupBy] = useState<'none' | 'month' | 'category'>('none');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    const [history, setHistory] = useState<Transaction[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const saveToHistory = (newTransactions: Transaction[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newTransactions);
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('luxury_cashflow_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setTransactions(parsed);
                    setHistory([parsed]);
                    setHistoryIndex(0);
                }
            } catch (e) {
                setTransactions([]);
                setHistory([[]]);
                setHistoryIndex(0);
            }
        } else {
            setHistory([[]]);
            setHistoryIndex(0);
        }
        setLoading(false);
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('luxury_cashflow_data', JSON.stringify(transactions));
        }
    }, [transactions, loading]);

    const updateWithHistory = (updater: (prev: Transaction[]) => Transaction[]) => {
        setTransactions(prev => {
            const next = updater(prev);
            saveToHistory(next);
            return next;
        });
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setTransactions(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setTransactions(history[historyIndex + 1]);
        }
    };

    // --- CALCULATIONS ---
    const calculatedData = useMemo(() => {
        let runningEstBalance = 0;
        let runningActBalance = 0;

        return transactions.map((t) => {
            const planIncome = Number(t.planIncome) || 0;
            const planExpense = Number(t.planExpense) || 0;
            const actIncome = Number(t.actIncome) || 0;
            const actExpense = Number(t.actExpense) || 0;

            runningEstBalance += planIncome - planExpense;
            const effectiveIncome = actIncome !== 0 ? actIncome : planIncome;
            const effectiveExpense = actExpense !== 0 ? actExpense : planExpense;
            runningActBalance += effectiveIncome - effectiveExpense;

            return {
                ...t,
                estBalance: runningEstBalance,
                actBalance: runningActBalance,
                difference: runningActBalance - runningEstBalance
            } as CalculatedTransaction;
        });
    }, [transactions]);

    const filteredData = useMemo(() => {
        let data = calculatedData;

        // 1. Search Filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase().trim();
            if (lowerQ) {
                data = data.filter(t =>
                    (t.description || '').toLowerCase().includes(lowerQ) ||
                    (t.category || '').toLowerCase().includes(lowerQ) ||
                    (t.date || '').toLowerCase().includes(lowerQ) ||
                    (t.planIncome?.toString() || '').includes(lowerQ) ||
                    (t.planExpense?.toString() || '').includes(lowerQ) ||
                    (t.actIncome?.toString() || '').includes(lowerQ) ||
                    (t.actExpense?.toString() || '').includes(lowerQ) ||
                    formatCurrency(t.planIncome || 0).toLowerCase().includes(lowerQ) ||
                    formatCurrency(t.planExpense || 0).toLowerCase().includes(lowerQ) ||
                    formatCurrency(t.actIncome || 0).toLowerCase().includes(lowerQ) ||
                    formatCurrency(t.actExpense || 0).toLowerCase().includes(lowerQ)
                );
            }
        }

        // 2. Category Filter
        if (categoryFilter !== 'All') {
            data = data.filter(t => t.category === categoryFilter);
        }

        // 3. Date Filter
        if (!dateFilter.start && !dateFilter.end) return data;

        return data.filter(item => {
            const itemDateVal = parseDateValue(item.date);
            let isValid = true;
            if (dateFilter.start) {
                const [y, m, d] = dateFilter.start.split('-').map(Number);
                if (itemDateVal < new Date(y, m - 1, d).getTime()) isValid = false;
            }
            if (dateFilter.end) {
                const [y, m, d] = dateFilter.end.split('-').map(Number);
                if (itemDateVal > new Date(y, m - 1, d).getTime()) isValid = false;
            }
            return isValid;
        });
    }, [calculatedData, dateFilter, searchQuery, categoryFilter]);

    const totals = useMemo(() => {
        const finalEstBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].estBalance : 0;
        const finalActBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].actBalance : 0;

        const income = filteredData.reduce((acc, curr) => acc + (curr.actIncome || curr.planIncome), 0);
        const expense = filteredData.reduce((acc, curr) => acc + (curr.actExpense || curr.planExpense), 0);

        return { finalEstBalance, finalActBalance, periodIncome: income, periodExpense: expense };
    }, [calculatedData, filteredData]);

    const handleUpdate = (id: number, field: keyof Transaction, value: any) => {
        updateWithHistory(prev => {
            let next = prev.map(t => t.id === id ? { ...t, [field]: value } : t);
            if (field === 'date') {
                next = next.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({ ...item, id: index + 1 }));
            }
            return next;
        });
    };

    const handleUpdateRow = (id: number, updatedRow: Partial<Transaction>) => {
        updateWithHistory(prev => {
            let next = prev.map(t => t.id === id ? { ...t, ...updatedRow } : t);
            if (updatedRow.date !== undefined) {
                next = next.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({ ...item, id: index + 1 }));
            }
            return next;
        });
    };

    const handleDelete = (id: number) => {
        updateWithHistory(prev => {
            const remaining = prev.filter(t => t.id !== id);
            return remaining.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({ ...item, id: index + 1 }));
        });
    };

    const handleAddRow = (targetId: number, position: 'above' | 'below') => {
        updateWithHistory(prev => {
            const targetIndex = prev.findIndex(t => t.id === targetId);
            if (targetIndex === -1) return prev;

            const targetRow = prev[targetIndex];
            const newRow: Transaction = {
                id: 0,
                date: targetRow.date,
                description: '',
                category: 'Lainnya',
                planIncome: 0,
                planExpense: 0,
                actIncome: 0,
                actExpense: 0,
                isNew: true
            };

            const newList = [...prev];
            if (position === 'above') {
                newList.splice(targetIndex, 0, newRow);
            } else {
                newList.splice(targetIndex + 1, 0, newRow);
            }

            return newList.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({ ...item, id: index + 1 }));
        });
    };

    const addTransaction = (newTransactionItem: Transaction) => {
        updateWithHistory(prev => {
            const unsorted = [...prev, newTransactionItem];
            return unsorted.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({ ...item, id: index + 1 }));
        });
    };

    const resetData = () => {
        setTransactions([]);
        setHistory([[]]);
        setHistoryIndex(0);
        localStorage.removeItem('luxury_cashflow_data');
    };

    return {
        transactions,
        setTransactions,
        loading,
        calculatedData,
        filteredData,
        totals,
        dateFilter,
        setDateFilter,
        groupBy,
        setGroupBy,
        categoryFilter,
        setCategoryFilter,
        handleUpdate,
        handleUpdateRow,
        handleDelete,
        handleAddRow,
        addTransaction,
        resetData,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
}
