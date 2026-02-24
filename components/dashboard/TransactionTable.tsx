import React from 'react';
import { Trash2, Monitor, List, Layers, Filter, MoreVertical, Pencil, Undo2, Redo2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CalculatedTransaction, Transaction } from '../../types';
import { formatCurrency, parseCurrency, parseDateValue } from '../../utils/formatters';
import { CATEGORIES } from '../../constants';
import { HelpButton } from '../ui/HelpButton';

interface TransactionTableProps {
    filteredData: CalculatedTransaction[];
    compactMode: boolean;
    setCompactMode: (compact: boolean) => void;
    handleUpdate: (id: number, field: keyof Transaction, value: any) => void;
    handleUpdateRow: (id: number, updatedRow: Partial<Transaction>) => void;
    handleDelete: (id: number) => void;
    handleContextMenu: (e: React.MouseEvent, id: number) => void;
    groupBy: 'none' | 'month' | 'category';
    setGroupBy: (val: 'none' | 'month' | 'category') => void;
    categoryFilter: string;
    setCategoryFilter: (val: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    categories: { name: string; color: string }[];
}

export function TransactionTable({
    filteredData,
    compactMode,
    setCompactMode,
    handleUpdate,
    handleUpdateRow,
    handleDelete,
    handleContextMenu,
    groupBy,
    setGroupBy,
    categoryFilter,
    setCategoryFilter,
    undo,
    redo,
    canUndo,
    canRedo,
    showToast,
    categories,
}: TransactionTableProps) {
    const [openActionId, setOpenActionId] = React.useState<number | null>(null);
    const [editDraft, setEditDraft] = React.useState<CalculatedTransaction | null>(null);
    const [confirmDialog, setConfirmDialog] = React.useState(false);

    const checkModified = React.useCallback(() => {
        if (!editDraft) return false;
        const original = filteredData.find(r => r.id === editDraft.id);
        return original && (
            original.date !== editDraft.date ||
            original.description !== editDraft.description ||
            original.category !== editDraft.category ||
            original.planIncome !== editDraft.planIncome ||
            original.planExpense !== editDraft.planExpense ||
            original.actIncome !== editDraft.actIncome ||
            original.actExpense !== editDraft.actExpense
        );
    }, [editDraft, filteredData]);

    React.useEffect(() => {
        const handleClickOutside = () => setOpenActionId(null);
        if (openActionId !== null) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionId]);

    React.useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (!editDraft) return;
            if (confirmDialog) return;

            const target = e.target as HTMLElement;
            // Ignore clicks within the editing row
            if (target.closest(`[data-row-id="${editDraft.id}"]`)) return;
            // Ignore clicks within the action menu of the editing row
            if (target.closest(`[data-action-menu-id="${editDraft.id}"]`)) return;
            // Ignore clicks inside the confirm dialog itself
            if (target.closest('.confirm-dialog-overlay')) return;

            if (checkModified()) {
                setConfirmDialog(true);
            } else {
                setEditDraft(null); // No changes, just close edit mode
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [editDraft, confirmDialog, checkModified]);

    // Enter key to save when editing
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!editDraft) return;
            if (e.key === 'Enter') {
                e.preventDefault();
                if (checkModified()) {
                    setConfirmDialog(true);
                }
            }
            if (e.key === 'Escape') {
                setEditDraft(null);
                setConfirmDialog(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [editDraft, checkModified]);

    const handleInitiateEdit = (row: CalculatedTransaction) => {
        if (editDraft?.id === row.id) return;

        if (checkModified()) {
            setConfirmDialog(true);
            return;
        }
        setEditDraft({ ...row });
    };

    const handleSaveDraft = () => {
        if (!editDraft) return;

        const original = filteredData.find(r => r.id === editDraft.id);
        if (original) {
            handleUpdateRow(editDraft.id, {
                date: editDraft.date,
                description: editDraft.description,
                category: editDraft.category,
                planIncome: editDraft.planIncome,
                planExpense: editDraft.planExpense,
                actIncome: editDraft.actIncome,
                actExpense: editDraft.actExpense
            });

            setTimeout(() => {
                showToast('Data berhasil diedit ✓', 'success');
            }, 100);
        }

        setEditDraft(null);
        setConfirmDialog(false);
    };

    const handleCancelDraft = () => {
        setEditDraft(null);
        setConfirmDialog(false);
    };

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
        data.map(row => {
            const isEditing = editDraft?.id === row.id;
            const currentData = isEditing ? editDraft : row;

            return (
                <tr
                    key={row.id}
                    data-row-id={row.id}
                    className={cn("group transition-all duration-200 relative",
                        compactMode ? "h-10" : "h-12",
                        isEditing ? "bg-indigo-50/50 shadow-[inset_0_0_0_2px_#6366f1] z-10" : "hover:bg-stone-100"
                    )}
                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                >
                    <td className="p-3 text-center text-stone-400 font-mono text-[10px] border-r border-stone-100">
                        {row.id}
                    </td>
                    <td className="p-0 border-r border-stone-100">
                        <input
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.date}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, date: e.target.value })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none font-medium text-[11px]", isEditing ? "text-indigo-900 bg-white" : "text-stone-700 cursor-default")}
                        />
                    </td>
                    <td className="p-0 border-r border-stone-100 relative">
                        <input
                            id={`desc-${row.id}`}
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.description}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, description: e.target.value })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none", isEditing ? "text-indigo-900 bg-white" : "text-stone-600 cursor-default")}
                        />
                        {row.isNew && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                    </td>
                    <td className="p-0 border-r border-stone-100">
                        <select
                            disabled={!isEditing}
                            value={currentData.category}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, category: e.target.value })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none text-[10px] font-medium appearance-none",
                                isEditing ? "cursor-pointer bg-white" : "",
                                categories.find(c => c.name === currentData.category)?.color
                            )}
                        >
                            {categories.map(c => <option key={c.name} value={c.name} className="bg-white text-stone-800">{c.name}</option>)}
                        </select>
                    </td>

                    <td className="p-0 border-stone-100 hidden sm:table-cell">
                        <input
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.planIncome ? formatCurrency(currentData.planIncome) : ''}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, planIncome: parseCurrency(e.target.value) })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none text-right font-mono text-[11px]", isEditing ? "text-indigo-900 bg-white" : "text-stone-500 cursor-default")}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-0 border-stone-100 hidden sm:table-cell">
                        <input
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.planExpense ? formatCurrency(currentData.planExpense) : ''}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, planExpense: parseCurrency(e.target.value) })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none text-right font-mono text-[11px]", isEditing ? "text-indigo-900 bg-white" : "text-stone-500 cursor-default")}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-0 border-r border-stone-100 bg-stone-50/50 hidden sm:table-cell">
                        <div className="flex items-center justify-end h-full px-3 text-stone-700 font-mono font-bold text-[11px]">{formatCurrency(row.estBalance)}</div>
                    </td>

                    <td className="p-0 border-stone-100">
                        <input
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.actIncome ? formatCurrency(currentData.actIncome) : ''}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, actIncome: parseCurrency(e.target.value) })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none text-right font-bold font-mono text-[11px]", isEditing ? "text-indigo-900 bg-white" : "text-emerald-600 cursor-default")}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-0 border-stone-100">
                        <input
                            readOnly={!isEditing}
                            type="text"
                            value={currentData.actExpense ? formatCurrency(currentData.actExpense) : ''}
                            onChange={(e) => isEditing && setEditDraft({ ...editDraft!, actExpense: parseCurrency(e.target.value) })}
                            className={cn("w-full h-full px-3 bg-transparent outline-none text-right font-bold font-mono text-[11px]", isEditing ? "text-indigo-900 bg-white" : "text-rose-600 cursor-default")}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-0 border-r border-stone-100 bg-stone-50/50">
                        <div className="flex items-center justify-end h-full px-3 text-stone-800 font-mono font-bold text-[11px]">{formatCurrency(row.actBalance)}</div>
                    </td>
                    <td className={cn("p-0 text-right px-3 font-mono font-medium text-xs", row.difference > 0 ? "text-emerald-600" : row.difference < 0 ? "text-rose-600" : "text-stone-300")}>
                        {formatCurrency(row.difference)}
                    </td>
                    <td className="p-0 border-stone-100 relative text-center">
                        <button
                            onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === row.id ? null : row.id); }}
                            className={cn("p-1.5 rounded-md active-shrink transition-all", openActionId === row.id ? "bg-stone-200 text-stone-600" : "text-stone-400 hover:text-stone-600 hover:bg-stone-50")}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {openActionId === row.id && (
                            <div
                                data-action-menu-id={row.id}
                                className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-[60] overflow-hidden min-w-[120px] animate-fade-in text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => {
                                        handleInitiateEdit(row);
                                        setOpenActionId(null);
                                        setTimeout(() => {
                                            const input = document.getElementById(`desc-${row.id}`);
                                            if (input) input.focus();
                                        }, 50);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100"
                                >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => { handleDelete(row.id); setOpenActionId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                </button>
                            </div>
                        )}
                    </td>
                </tr>
            );
        })
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

                    <div className="flex items-center gap-1.5 ml-2">
                        <button
                            onClick={undo}
                            disabled={!canUndo}
                            className={cn("p-1.5 rounded-md transition-colors", canUndo ? "text-stone-600 hover:bg-stone-200" : "text-stone-300 cursor-not-allowed")}
                            title="Undo"
                        >
                            <Undo2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={!canRedo}
                            className={cn("p-1.5 rounded-md transition-colors", canRedo ? "text-stone-600 hover:bg-stone-200" : "text-stone-300 cursor-not-allowed")}
                            title="Redo"
                        >
                            <Redo2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filteredData.length} baris ditemukan</span>
                    <HelpButton
                        title="Tips Tabel Data"
                        tips={[
                            { title: 'Edit Inline', desc: 'Klik langsung pada sel tanggal, keterangan, atau nominal untuk mengedit.' },
                            { title: 'Format Tanggal', desc: 'Gunakan format DD/MM/YYYY atau YYYY-MM-DD. Contoh: 24/02/2026.' },
                            { title: 'Format Nominal', desc: 'Ketik angka saja, sistem otomatis memformat jadi Rupiah. Contoh: 50000.' },
                            { title: 'Group By', desc: 'Kelompokkan baris berdasarkan bulan atau kategori untuk analisis lebih mudah.' },
                            { title: 'Filter Kategori', desc: 'Tampilkan hanya transaksi kategori tertentu menggunakan dropdown Filter.' },
                            { title: 'Klik Kanan', desc: 'Klik kanan pada baris untuk opsi tambah baris di atas/bawah.' },
                            { title: 'Hapus', desc: 'Klik ikon 🗑️ di kolom Aksi untuk menghapus satu baris transaksi.' },
                        ]}
                    />
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

            {/* Confirm Dialog for Unsaved Edits */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-[2px] confirm-dialog-overlay">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full animate-scale-in text-center mx-4">
                        <h3 className="text-lg font-bold text-stone-800 mb-2">Simpan Perubahan?</h3>
                        <p className="text-stone-500 text-sm mb-6">Anda memiliki perubahan yang belum disimpan pada baris ini. Apakah Anda ingin menyimpannya?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDraft}
                                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-sm hover:bg-stone-50 transition-colors"
                            >
                                Tidak
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all active:scale-[0.98]"
                            >
                                Ya, Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
