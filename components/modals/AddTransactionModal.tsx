import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TransactionCategory } from '../../types';
import { CATEGORIES } from '../../constants';

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
}

export function AddTransactionModal({
    isModalOpen,
    setIsModalOpen,
    newTrans,
    setNewTrans,
    handleCurrencyInput,
    handleAddTransaction
}: AddTransactionModalProps) {
    if (!isModalOpen) return null;

    const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden">
                <div className="bg-stone-50 px-8 py-6 border-b border-stone-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-stone-800">Transaksi Baru</h2>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-stone-400" /></button>
                </div>
                <form onSubmit={handleAddTransaction} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Tanggal</label>
                            <input type="date" required value={newTrans.date} onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Kategori</label>
                            <select value={newTrans.category} onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value as TransactionCategory })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400">
                                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase">Keterangan</label>
                        <input type="text" required placeholder="Contoh: Beli Kopi" value={newTrans.description} onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-emerald-500 uppercase">Masuk</label>
                            <input type="text" placeholder="0" value={newTrans.planIncome} onChange={(e) => handleCurrencyInput('planIncome', e.target.value)} className="w-full p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-rose-500 uppercase">Keluar</label>
                            <input type="text" placeholder="0" value={newTrans.planExpense} onChange={(e) => handleCurrencyInput('planExpense', e.target.value)} className="w-full p-2.5 bg-rose-50 border border-rose-100 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 text-right font-bold text-rose-600" />
                        </div>
                    </div>
                    <button type="submit" className={cn("w-full py-3 rounded-xl font-bold mt-4 flex justify-center items-center gap-2", btnPrimaryClass)}>
                        <CheckCircle2 className="w-5 h-5" /> Simpan
                    </button>
                </form>
            </div>
        </div>
    );
}
