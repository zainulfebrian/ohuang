import React from 'react';
import { Trash2, Monitor, List, Layers, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CalculatedTransaction, Transaction } from '../../types';
import { formatCurrency, parseCurrency, parseDateValue } from '../../utils/formatters';
import { CATEGORIES } from '../../constants';

interface TransactionTableProps {
    filteredData: CalculatedTransaction[];
    compactMode: boolean;
    setCompactMode: (compact: boolean) => void;
    handleUpdate: (id: number, field: keyof Transaction, value: any) => void;
    handleDelete: (id: number) => void;
    handleContextMenu: (e: React.MouseEvent, id: number) => void;
    groupBy: 'none' | 'month' | 'category';
    setGroupBy: (val: 'none' | 'month' | 'category') => void;
    categoryFilter: string;
    setCategoryFilter: (val: string) => void;
}

export function TransactionTable({
    filteredData,
    compactMode,
    setCompactMode,
    handleUpdate,
    handleDelete,
    handleContextMenu,
    groupBy,
    setGroupBy,
    categoryFilter,
    setCategoryFilter
}: TransactionTableProps) {
    // Logic for Grouping
    const groupedData = React.useMemo(() => {
        if (groupBy === 'none') return null;

        const groups: { [key: string]: CalculatedTransaction[] } = {};
        filteredData.forEach(t => {
            let key = '';
            if (groupBy === 'month') {
                const date = new Date(parseDateValue(t.date));
                key = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            } else if (groupBy === 'category') {
                key = t.category;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    }, [filteredData, groupBy]);

    const renderRows = (data: CalculatedTransaction[]) => (
        data.map(row => (
            <tr key={row.id} className={cn("group hover:bg-stone-100 transition-colors duration-200", compactMode ? "h-10" : "h-12")} onContextMenu={(e) => handleContextMenu(e, row.id)}>
                <td className="p-3 text-center text-stone-400 font-mono text-[10px] border-r border-stone-100">
                    {row.id}
                </td>
                <td className="p-0 border-r border-stone-100">
                    <input type="text" value={row.date} onChange={(e) => handleUpdate(row.id, 'date', e.target.value)} className="w-full h-full px-3 bg-transparent outline-none text-stone-700 font-medium" />
                </td>
                <td className="p-0 border-r border-stone-100 relative">
                    <input type="text" value={row.description} onChange={(e) => handleUpdate(row.id, 'description', e.target.value)} className="w-full h-full px-3 bg-transparent outline-none text-stone-600" />
                    {row.isNew && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                </td>
                {/* Category Dropdown */}
                <td className="p-0 border-r border-stone-100">
                    <select
                        value={row.category}
                        onChange={(e) => handleUpdate(row.id, 'category', e.target.value)}
                        className={cn("w-full h-full px-3 bg-transparent outline-none text-[10px] font-medium appearance-none cursor-pointer",
                            CATEGORIES.find(c => c.name === row.category)?.color
                        )}
                    >
                        {CATEGORIES.map(c => <option key={c.name} value={c.name} className="bg-white text-stone-800">{c.name}</option>)}
                    </select>
                </td>

                {/* Columns hidden on mobile handled by CSS classes above, only inputs here */}
                <td className="p-0 border-stone-100 hidden sm:table-cell"><input type="text" value={row.planIncome ? formatCurrency(row.planIncome) : ''} onChange={(e) => handleUpdate(row.id, 'planIncome', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-stone-500 font-mono" placeholder="0" /></td>
                <td className="p-0 border-stone-100 hidden sm:table-cell"><input type="text" value={row.planExpense ? formatCurrency(row.planExpense) : ''} onChange={(e) => handleUpdate(row.id, 'planExpense', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-stone-500 font-mono" placeholder="0" /></td>
                <td className="p-0 border-r border-stone-100 bg-stone-50/50 hidden sm:table-cell"><div className="flex items-center justify-end h-full px-3 text-stone-700 font-mono font-bold">{formatCurrency(row.estBalance)}</div></td>

                <td className="p-0 border-stone-100"><input type="text" value={row.actIncome ? formatCurrency(row.actIncome) : ''} onChange={(e) => handleUpdate(row.id, 'actIncome', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-emerald-600 font-bold font-mono" placeholder="0" /></td>
                <td className="p-0 border-stone-100"><input type="text" value={row.actExpense ? formatCurrency(row.actExpense) : ''} onChange={(e) => handleUpdate(row.id, 'actExpense', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-rose-600 font-bold font-mono" placeholder="0" /></td>
                <td className="p-0 border-r border-stone-100 bg-stone-50/50"><div className="flex items-center justify-end h-full px-3 text-stone-800 font-mono font-bold">{formatCurrency(row.actBalance)}</div></td>
                <td className={cn("p-0 text-right px-3 font-mono font-medium text-xs", row.difference > 0 ? "text-emerald-600" : row.difference < 0 ? "text-rose-600" : "text-stone-300")}>
                    {formatCurrency(row.difference)}
                </td>
                <td className="p-0 border-stone-100 text-center">
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 text-stone-400 hover:text-rose-500 transition-colors rounded-md hover:bg-rose-50 active-shrink" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </td>
            </tr>
        ))
    );

    return (
        <div className="bg-white rounded-lg shadow-xl shadow-stone-200/50 border border-stone-200 flex flex-col h-full relative z-0">
            {/* Toolbar Area */}
            <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap gap-4 items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-stone-400" />
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Group By:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                            className="bg-white border border-stone-200 rounded-md px-2 py-1 text-[11px] font-bold text-stone-700 outline-none focus:ring-2 focus:ring-stone-300"
                        >
                            <option value="none">None</option>
                            <option value="month">Month</option>
                            <option value="category">Category</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-stone-400" />
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Category:</span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-white border border-stone-200 rounded-md px-2 py-1 text-[11px] font-bold text-stone-700 outline-none focus:ring-2 focus:ring-stone-300"
                        >
                            <option value="All">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filteredData.length} baris ditemukan</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <table className="w-full text-xs border-collapse table-fixed text-left">
                    <thead className="bg-stone-100 text-stone-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-sm text-left">
                        <tr>
                            <th className="w-[3%] p-3 text-center border-b border-r border-stone-200">ID</th>
                            <th className="w-[8%] p-3 border-b border-r border-stone-200">Tanggal</th>
                            <th className="w-[16%] p-3 border-b border-r border-stone-200">Keterangan</th>
                            <th className="w-[8%] p-3 border-b border-r border-stone-200">Kategori</th>
                            <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-emerald-50/50 text-emerald-700 hidden sm:table-cell">Renc Masuk</th>
                            <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-rose-50/50 text-rose-700 hidden sm:table-cell">Renc Keluar</th>
                            <th className="w-[9%] p-3 text-right border-b border-r border-stone-200 bg-stone-100 text-stone-700 font-bold hidden sm:table-cell">Est Saldo</th>
                            <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-emerald-100/30 text-emerald-800">Akt Masuk</th>
                            <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-rose-100/30 text-rose-800">Akt Keluar</th>
                            <th className="w-[9%] p-3 text-right border-b border-r border-stone-200 bg-stone-100 text-stone-800 font-bold">Saldo Akt</th>
                            <th className="w-[7%] p-3 text-right border-b border-stone-200">Selisih</th>
                            <th className="w-[4%] p-3 text-center border-b border-stone-200">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {groupBy === 'none' && renderRows(filteredData)}

                        {groupBy !== 'none' && groupedData && Object.keys(groupedData).map(groupKey => {
                            const groupRows = groupedData[groupKey];
                            const groupInc = groupRows.reduce((sum, r) => sum + (r.actIncome || r.planIncome || 0), 0);
                            const groupExp = groupRows.reduce((sum, r) => sum + (r.actExpense || r.planExpense || 0), 0);

                            return (
                                <React.Fragment key={groupKey}>
                                    <tr className="bg-stone-50/80 sticky top-[33px] z-[5]">
                                        <td colSpan={4} className="p-2 px-4 border-y border-stone-200">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-stone-800 rounded-full"></div>
                                                <span className="font-bold text-stone-700 uppercase tracking-widest text-[11px]">{groupKey}</span>
                                                <span className="text-[10px] text-stone-400 font-medium font-mono ml-2">({groupRows.length} items)</span>
                                            </div>
                                        </td>
                                        <td className="p-2 border-y border-stone-200 text-right font-bold text-emerald-600 hidden sm:table-cell text-[10px] tabular-nums bg-emerald-50/30">
                                            {formatCurrency(groupInc)}
                                        </td>
                                        <td className="p-2 border-y border-stone-200 text-right font-bold text-rose-600 hidden sm:table-cell text-[10px] tabular-nums bg-rose-50/30">
                                            {formatCurrency(groupExp)}
                                        </td>
                                        <td colSpan={5} className="p-2 border-y border-stone-200"></td>
                                    </tr>
                                    {renderRows(groupRows)}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Mobile Floating Fab for Filter */}
            <div className="md:hidden fixed bottom-20 right-4">
                <button onClick={() => setCompactMode(!compactMode)} className="bg-stone-800 text-white p-3 rounded-full shadow-lg">
                    {compactMode ? <Monitor className="w-5 h-5" /> : <List className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}
