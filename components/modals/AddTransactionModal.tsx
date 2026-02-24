import React, { useState } from 'react';
import { X, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TransactionCategory } from '../../types';
import { Category } from '../../hooks/useCategories';

interface AddTransactionModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    newTrans: {
        date: string;
        description: string;
        category: TransactionCategory;
        planIncome: string;
        planExpense: string;
    };
    setNewTrans: (trans: any) => void;
    handleCurrencyInput: (field: 'planIncome' | 'planExpense', value: string) => void;
    handleAddTransaction: (e: React.FormEvent) => void;
    categories: Category[];
}

export function AddTransactionModal({
    isModalOpen,
    setIsModalOpen,
    newTrans,
    setNewTrans,
    handleCurrencyInput,
    handleAddTransaction,
    categories,
}: AddTransactionModalProps) {
    const [type, setType] = useState<'income' | 'expense'>('expense');

    if (!isModalOpen) return null;

    const handleTypeSwitch = (newType: 'income' | 'expense') => {
        setType(newType);
        // Reset amounts when switching
        setNewTrans({ ...newTrans, planIncome: '', planExpense: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        // Ensure the correct field is set
        if (type === 'income' && newTrans.planExpense) {
            setNewTrans({ ...newTrans, planExpense: '' });
        }
        if (type === 'expense' && newTrans.planIncome) {
            setNewTrans({ ...newTrans, planIncome: '' });
        }
        handleAddTransaction(e);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden">

                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5 sm:hidden"></div>
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-stone-800">Transaksi Baru</h2>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                            <X className="w-5 h-5 text-stone-400" />
                        </button>
                    </div>
                </div>

                {/* Type Toggle */}
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => handleTypeSwitch('income')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                type === 'income'
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                    : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Pemasukan
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeSwitch('expense')}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                type === 'expense'
                                    ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                                    : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            <TrendingDown className="w-4 h-4" />
                            Pengeluaran
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tanggal</label>
                            <input
                                type="date"
                                required
                                value={newTrans.date}
                                onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })}
                                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Kategori</label>
                            <select
                                value={newTrans.category}
                                onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value as TransactionCategory })}
                                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                            >
                                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Keterangan</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Gaji Bulanan"
                            value={newTrans.description}
                            onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })}
                            className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                        />
                    </div>

                    {/* Amount Field - single field based on type */}
                    <div className="space-y-1.5">
                        <label className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                            Nominal {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </label>
                        <div className={cn(
                            "flex items-center gap-2 rounded-xl border p-2.5",
                            type === 'income' ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                        )}>
                            <span className={cn("text-sm font-bold", type === 'income' ? "text-emerald-500" : "text-rose-500")}>Rp</span>
                            <input
                                type="text"
                                placeholder="0"
                                value={type === 'income' ? newTrans.planIncome : newTrans.planExpense}
                                onChange={(e) => handleCurrencyInput(type === 'income' ? 'planIncome' : 'planExpense', e.target.value)}
                                className={cn(
                                    "flex-1 bg-transparent outline-none text-right font-bold text-lg",
                                    type === 'income' ? "text-emerald-700" : "text-rose-700"
                                )}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={cn(
                            "w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 shadow-lg transition-all active:scale-[0.98] mt-2",
                            type === 'income'
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                                : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                        )}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Simpan {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                </form>
            </div>
        </div>
    );
}
