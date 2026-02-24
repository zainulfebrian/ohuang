import React from 'react';
import {
    Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
    Plus, Trash2, Pencil, Calendar, List, PieChart as PieIcon,
    Target, Settings, Download, Trash, RefreshCcw, TrendingUp,
    LogOut, Database, X, LayoutDashboard, TrendingDown, CheckCircle2,
    Monitor, ArrowRight, AlertCircle, Save, Info, AlertTriangle, FileJson,
    ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Transaction, CalculatedTransaction, TransactionCategory } from '../../types';
import { reverseDateForInput } from '../../utils/formatters';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AboutView } from '../views/AboutView';
import { AnalyticsView } from '../views/AnalyticsView';
import { DateRange } from '../../hooks/useAnalytics';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MobileViewProps {
    transactions: Transaction[];
    filteredData: CalculatedTransaction[];
    calculatedData?: any[];
    analyticsData: any;
    totals: any;
    onUpdate: (id: number, field: keyof Transaction, value: any) => void;
    onDelete: (id: number) => void;
    onAddRow: (targetId: number, position: 'above' | 'below') => void;
    onAddTransaction: (e: React.FormEvent) => void;
    viewMode: 'table' | 'calendar' | 'analytics' | 'budget' | 'about';
    setViewMode: (mode: 'table' | 'calendar' | 'analytics' | 'budget' | 'about') => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    newTrans: any;
    setNewTrans: (trans: any) => void;
    handleCurrencyInput: (field: 'planIncome' | 'planExpense', value: string) => void;
    CATEGORIES: { name: string; color: string }[];
    calendarDate: Date;
    setCalendarDate: (date: Date) => void;
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
    monthNames: string[];
    calendarGrid: (Date | null)[];
    getTransactionsForDate: (date: Date) => Transaction[];
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    formatCurrency: (value: number) => string;
    parseDateValue: (dateStr: string) => number;
    appVersion: string;
    updateAvailable: boolean;
    setShowUpdateModal: (show: boolean) => void;
    setShowFileManager: (show: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setActiveTab: (tab: 'save' | 'open') => void;
    budgets: any[];
    onUpdateBudget: (category: string, limit: number) => void;
    onExportPDF?: () => void;
    currentMonthYear: string;
    dateRange: DateRange;
    setDateRange: (r: DateRange) => void;
}

export const MobileView: React.FC<MobileViewProps> = ({
    transactions,
    filteredData,
    calculatedData,
    analyticsData,
    totals,
    onUpdate,
    onDelete,
    onAddRow,
    onAddTransaction,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    newTrans,
    setNewTrans,
    handleCurrencyInput,
    CATEGORIES,
    calendarDate,
    setCalendarDate,
    selectedDate,
    setSelectedDate,
    monthNames,
    calendarGrid,
    getTransactionsForDate,
    handlePrevMonth,
    handleNextMonth,
    formatCurrency,
    parseDateValue,
    appVersion,
    updateAvailable,
    setShowUpdateModal,
    setShowFileManager,
    setIsSettingsOpen,
    setActiveTab,
    budgets,
    onUpdateBudget,
    onExportPDF,
    currentMonthYear,
    dateRange,
    setDateRange,
}) => {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>('desc');
    const [collapsedMonths, setCollapsedMonths] = React.useState<{ [key: string]: boolean }>({});
    const [exitConfirmOpen, setExitConfirmOpen] = React.useState(false);

    // Confirmation & Edit States
    const [confirmModal, setConfirmModal] = React.useState<{
        open: boolean;
        title: string;
        message: string;
        type: 'danger' | 'primary' | 'success';
        action: () => void;
    }>({ open: false, title: '', message: '', type: 'primary', action: () => { } });

    const [editMode, setEditMode] = React.useState<number | null>(null);
    const [budgetEditModal, setBudgetEditModal] = React.useState<{ open: boolean; category: string; limit: number }>({ open: false, category: '', limit: 0 });
    const [editBudgetLimit, setEditBudgetLimit] = React.useState('');
    const [openActionId, setOpenActionId] = React.useState<number | null>(null);
    const [mobileModalType, setMobileModalType] = React.useState<'income' | 'expense'>('expense');

    // --- Android Hardware Back Button → Exit Confirmation ---
    React.useEffect(() => {
        let listenerHandle: { remove: () => void } | null = null;
        const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
        if (!isNative) return;

        import('@capacitor/app').then(({ App }) => {
            App.addListener('backButton', ({ canGoBack }) => {
                if (!canGoBack) {
                    setExitConfirmOpen(true);
                }
            }).then(handle => { listenerHandle = handle; });
        }).catch(() => { });

        return () => { listenerHandle?.remove(); };
    }, []);

    React.useEffect(() => {
        const handleClickOutside = () => setOpenActionId(null);
        if (openActionId !== null) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionId]);

    const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";

    const groupedTransactions = React.useMemo(() => {
        const groups: { [key: string]: CalculatedTransaction[] } = {};
        filteredData.forEach(t => {
            const date = new Date(parseDateValue(t.date));
            const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            if (!groups[monthYear]) groups[monthYear] = [];
            groups[monthYear].push(t);
        });
        return groups;
    }, [filteredData, parseDateValue]);

    const sortedGroupKeys = React.useMemo(() => {
        return Object.keys(groupedTransactions).sort((a, b) => {
            const dateA = new Date(parseDateValue(groupedTransactions[a][0].date));
            const dateB = new Date(parseDateValue(groupedTransactions[b][0].date));
            return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });
    }, [groupedTransactions, parseDateValue, sortOrder]);

    const toggleMonth = (monthYear: string) => {
        setCollapsedMonths(prev => ({ ...prev, [monthYear]: !prev[monthYear] }));
    };

    const closeAllMonths = () => {
        const allClosed = sortedGroupKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
        setCollapsedMonths(allClosed);
    };

    const openAllMonths = () => {
        setCollapsedMonths({});
    };

    // Switch view and auto-close search
    const setViewModeWithSideEffects = (mode: 'table' | 'calendar' | 'analytics' | 'budget' | 'about') => {
        setViewMode(mode);
        if (mode !== 'table') setIsSearchOpen(false);
    };

    const handleDeleteClick = (id: number) => {
        setConfirmModal({
            open: true,
            title: 'Hapus Transaksi?',
            message: 'Data yang dihapus tidak dapat dikembalikan.',
            type: 'danger',
            action: () => {
                onDelete(id);
                setConfirmModal(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleEditClick = (trans: CalculatedTransaction) => {
        setNewTrans({
            date: trans.date.includes('/') ? reverseDateForInput(trans.date) : trans.date,
            description: trans.description,
            category: trans.category,
            planIncome: trans.planIncome === 0 ? '' : trans.planIncome.toString(),
            planExpense: trans.planExpense === 0 ? '' : trans.planExpense.toString()
        });
        setEditMode(trans.id);
        setIsModalOpen(true);
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();

        if (editMode) {
            setConfirmModal({
                open: true,
                title: 'Simpan Perubahan?',
                message: 'Apakah Anda yakin ingin memperbarui transaksi ini?',
                type: 'success',
                action: () => {
                    // We reuse onAddTransaction logic but it might need adjustment if App.tsx 
                    // doesn't support full replacement via onAddTransaction (which usually creates new)
                    // For now, we manually update fields if APP context doesn't have handleFullUpdate
                    const fields: (keyof Transaction)[] = ['date', 'description', 'category', 'planIncome', 'planExpense'];
                    fields.forEach(f => {
                        let val = newTrans[f];
                        if (f === 'planIncome' || f === 'planExpense') {
                            val = parseFloat(val.toString().replace(/[^0-9.-]+/g, "")) || 0;
                        }
                        onUpdate(editMode, f, val);
                    });

                    setIsModalOpen(false);
                    setEditMode(null);
                    setNewTrans({ date: new Date().toISOString().split('T')[0], description: '', category: CATEGORIES[3].name, planIncome: '', planExpense: '' });
                    setConfirmModal(prev => ({ ...prev, open: false }));
                }
            });
        } else {
            onAddTransaction(e);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-stone-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white px-4 py-3 border-b border-stone-200 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.png"
                        alt="OhMonsea Logo"
                        className="h-6 w-auto object-contain"
                    />
                    <div className="w-px h-6 bg-stone-200" />
                    <div>
                        <p className="text-[9px] uppercase tracking-[0.15em] font-bold leading-tight" style={{ color: '#1b2a4a' }}>Self Finance</p>
                        <p className="text-[8px] uppercase tracking-widest font-semibold" style={{ color: '#4a6080' }}>v{appVersion}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {updateAvailable && (
                        <button
                            onClick={() => setShowUpdateModal(true)}
                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg animate-pulse"
                        >
                            <AlertCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onExportPDF}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100"
                        title="Ekspor PDF"
                    >
                        <FileJson className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => { setShowFileManager(true); setActiveTab('open'); }}
                        className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Simpan Data"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-1.5 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors active-shrink"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className={cn("p-2 rounded-full ml-1 active-shrink", btnPrimaryClass)}>
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Fixed Sub-Header Area */}
            <div className="shrink-0 bg-white border-b border-stone-200 shadow-sm z-30">
                {/* Search Bar Overlay (Fixed) */}
                {isSearchOpen && (
                    <div className="px-4 py-3 animate-slide-down">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Cari transaksi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-stone-400 transition-all font-bold"
                            />
                        </div>
                    </div>
                )}

                {/* View-Specific Fixed Menu Area */}
                <div className="px-4 py-3">
                    {viewMode === 'table' && (
                        <div className="space-y-4">
                            {/* Summary Card (Fixed) */}
                            {(() => {
                                const isPositive = totals.finalActBalance >= 0;
                                return (
                                    <div className="bg-stone-800 px-4 py-3 rounded-xl text-white shadow-md flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">Total Saldo Aktual</p>
                                            <h2 className={cn("text-xl font-black tracking-tight", isPositive ? "text-white" : "text-rose-400")}>
                                                {formatCurrency(totals.finalActBalance)}
                                            </h2>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Estimasi</p>
                                            <p className="text-xs font-bold text-stone-300">{formatCurrency(totals.finalEstBalance)}</p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Table Controls (Fixed) */}
                            <div className="flex justify-between items-center pt-1">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsSearchOpen(prev => !prev)}
                                        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold active-shrink",
                                            isSearchOpen ? "bg-stone-800 border-stone-800 text-white shadow-md" : "bg-white border-stone-200 text-stone-500")}
                                    >
                                        <Search className="w-3.5 h-3.5" /> CARI
                                    </button>
                                    <button
                                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg text-[10px] font-bold active-shrink"
                                    >
                                        <ArrowUpDown className="w-3.5 h-3.5" />
                                        {sortOrder === 'desc' ? 'TERBARU' : 'TERLAMA'}
                                    </button>
                                </div>
                                <button
                                    onClick={Object.keys(collapsedMonths).length > 0 ? openAllMonths : closeAllMonths}
                                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[10px] font-bold transition-colors active-shrink"
                                >
                                    {Object.keys(collapsedMonths).length > 0 ? 'BUKA SEMUA' : 'TUTUP SEMUA'}
                                </button>
                            </div>
                        </div>
                    )}

                    {viewMode === 'analytics' && (
                        /* Highlights Row (Fixed) */
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                                <p className="text-[8px] font-bold text-stone-400 uppercase mb-0.5">Savings Rate</p>
                                <p className="text-base font-bold text-indigo-600 font-mono">{analyticsData.savingsRate.toFixed(1)}%</p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                                <p className="text-[9px] font-bold text-stone-400 uppercase mb-1">Net Savings</p>
                                <p className={cn("text-lg font-bold font-mono", analyticsData.netSavings < 0 ? "text-rose-600" : "text-emerald-600")}>
                                    {analyticsData.netSavings >= 0 ? '+' : ''}{formatCurrency(analyticsData.netSavings)}
                                </p>
                            </div>
                        </div>
                    )}

                    {viewMode === 'calendar' && (
                        /* Month Switcher (Fixed) */
                        <div className="bg-stone-50 px-3 py-2.5 rounded-xl border border-stone-200 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 text-xs">{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</h3>
                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-stone-600" /></button>
                                <button onClick={handleNextMonth} className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-stone-600" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content (Scrollable) */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {/* View: Data List */}
                {viewMode === 'table' && (
                    <div className="p-4">
                        <div className="space-y-6 pb-24">
                            {sortedGroupKeys.length === 0 ? (
                                <div className="text-center py-10 text-stone-400 text-xs italic bg-white rounded-xl border border-stone-100">
                                    Tidak ada transaksi ditemukan.
                                </div>
                            ) : (
                                sortedGroupKeys.map(monthYear => (
                                    <div key={monthYear} className="space-y-3">
                                        <button
                                            onClick={() => toggleMonth(monthYear)}
                                            className="w-full flex items-center gap-2 px-1 focus:outline-none"
                                        >
                                            <div className="h-px flex-1 bg-stone-200"></div>
                                            <div className="flex items-center gap-2 group">
                                                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest group-active:text-stone-600 transition-colors">{monthYear}</h3>
                                                {collapsedMonths[monthYear] ? <ChevronDown className="w-3 h-3 text-stone-300" /> : <ChevronUp className="w-3 h-3 text-stone-300" />}
                                            </div>
                                            <div className="h-px w-4 bg-stone-200"></div>
                                        </button>

                                        {!collapsedMonths[monthYear] && (
                                            <div className="space-y-3 animate-fade-in">
                                                {groupedTransactions[monthYear].map((row, index) => (
                                                    <div
                                                        key={row.id}
                                                        className={cn(
                                                            "bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative active:bg-stone-50 transition-all duration-300 animate-slide-up",
                                                            index < 5 ? `stagger - ${index + 1} ` : ""
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tight",
                                                                    CATEGORIES.find(c => c.name === row.category)?.color
                                                                )}>
                                                                    {row.category}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400 font-mono">#{row.id}</span>
                                                            </div>
                                                            <div className="flex gap-2 relative">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === row.id ? null : row.id); }}
                                                                    className={cn("p-1.5 rounded-lg active-shrink transition-all border border-stone-100", openActionId === row.id ? "bg-stone-200 text-stone-600" : "text-stone-400 hover:text-stone-600 bg-stone-50")}
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                                {openActionId === row.id && (
                                                                    <div
                                                                        className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px] animate-fade-in"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            onClick={() => { handleEditClick(row); setOpenActionId(null); }}
                                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100"
                                                                        >
                                                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { handleDeleteClick(row.id); setOpenActionId(null); }}
                                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-stone-800 mb-1">{row.description}</h4>
                                                        <div className="flex justify-between items-end">
                                                            <div className="text-[10px] text-stone-500 flex items-center gap-1 font-bold">
                                                                <Calendar className="w-3 h-3" /> {row.date}
                                                            </div>
                                                            <div className="text-right">
                                                                {(row.actIncome > 0 || row.planIncome > 0) && (
                                                                    <p className="text-emerald-600 font-bold text-xs font-mono">+{formatCurrency(row.actIncome || row.planIncome)}</p>
                                                                )}
                                                                {(row.actExpense > 0 || row.planExpense > 0) && (
                                                                    <p className="text-rose-600 font-bold text-xs font-mono">-{formatCurrency(row.actExpense || row.planExpense)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* View: Analytics */}
                {viewMode === 'analytics' && (
                    <div className="h-full overflow-hidden">
                        <AnalyticsView
                            analyticsData={analyticsData}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                        />
                    </div>
                )}

                {/* View: Budget */}
                {viewMode === 'budget' && (
                    <div className="p-4 space-y-4 pb-24">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                                    <Target className="w-6 h-6 text-indigo-500" />
                                    Anggaran
                                </h2>
                                <p className="text-stone-500 text-[11px] uppercase font-bold tracking-wider">{currentMonthYear}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="p-2 bg-stone-100 rounded-lg active:scale-90 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={handleNextMonth} className="p-2 bg-stone-100 rounded-lg active:scale-90 transition-all"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {budgets && budgets.length > 0 ? budgets.map((budget: any) => {
                            const spending = (calculatedData || []).reduce((sum, t) => {
                                if (!t.date) return sum;
                                try {
                                    const tDate = new Date(parseDateValue(t.date));
                                    if (isNaN(tDate.getTime())) return sum;

                                    const tMonthYear = monthNames && monthNames[tDate.getMonth()]
                                        ? `${monthNames[tDate.getMonth()]} ${tDate.getFullYear()} `
                                        : "";

                                    if (tMonthYear === currentMonthYear) {
                                        const amount = Number(t.actExpense || t.planExpense) || 0;
                                        const cleanCat = (t.category || "").trim().toLowerCase();
                                        const targetCat = (budget.category || "").trim().toLowerCase();
                                        return (cleanCat === targetCat && amount > 0) ? sum + amount : sum;
                                    }
                                } catch (e) {
                                    console.error("Error calculating mobile budget spending", e);
                                }
                                return sum;
                            }, 0);
                            const limit = budget.limit;
                            const percent = limit > 0 ? (spending / limit) * 100 : 0;
                            const isOver = limit > 0 && spending > limit;

                            return (
                                <div key={budget.category} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{budget.category}</p>
                                            <p className="text-sm font-bold text-stone-800">{formatCurrency(spending)} <span className="text-[10px] text-stone-400 font-normal">terpakai</span></p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsModalOpen(false);
                                                setBudgetEditModal({ open: true, category: budget.category, limit: budget.limit });
                                                setEditBudgetLimit(budget.limit.toString());
                                            }}
                                            className="p-2 bg-stone-50 text-stone-400 rounded-lg active:bg-indigo-50 active:text-indigo-600 transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className={cn(isOver ? "text-rose-500" : "text-stone-500")}>
                                                {limit > 0 ? `${percent.toFixed(0)}% ` : "Limit belum diatur"}
                                            </span>
                                            <span className="text-stone-400">Limit: {formatCurrency(limit)}</span>
                                        </div>
                                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-700", isOver ? "bg-rose-500" : "bg-emerald-500")}
                                                style={{ width: `${Math.min(percent, 100)}% ` }}
                                            ></div>
                                        </div>
                                    </div>
                                    {isOver && (
                                        <div className="bg-rose-50 p-2 rounded-lg flex items-center gap-2 text-[10px] text-rose-600 font-bold">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Over {formatCurrency(spending - limit)}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                                <div className="p-3 bg-stone-50 rounded-full">
                                    <Target className="w-6 h-6 text-stone-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-stone-800">Belum ada Anggaran</p>
                                    <p className="text-xs text-stone-400">Silakan tambahkan budget di versi Desktop.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* View: Calendar */}
                {viewMode === 'calendar' && (
                    <div className="p-4 space-y-4 pb-24">
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="grid grid-cols-7 text-center">
                                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map(d => (
                                    <div key={d} className="py-2 text-[10px] font-bold text-stone-400">{d}</div>
                                ))}
                                {calendarGrid.map((date, i) => {
                                    if (!date) return <div key={`empty - ${i} `} className="aspect-square bg-stone-50/50" />;
                                    const dayTrans = getTransactionsForDate(date);
                                    const hasIncome = dayTrans.some(t => t.actIncome > 0 || t.planIncome > 0);
                                    const hasExpense = dayTrans.some(t => t.actExpense > 0 || t.planExpense > 0);
                                    const isToday = new Date().toDateString() === date.toDateString();
                                    const isSelected = selectedDate === date.toISOString();

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(date.toISOString())}
                                            className={cn(
                                                "aspect-square flex flex-col items-center justify-center relative transition-all active:scale-90",
                                                isSelected ? "bg-stone-800 text-white shadow-inner" : "hover:bg-stone-50",
                                                isToday && !isSelected && "text-indigo-600 font-bold underline"
                                            )}
                                        >
                                            <span className="text-xs">{date.getDate()}</span>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {hasIncome && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-emerald-500")} />}
                                                {hasExpense && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-rose-500")} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Floating Selected Date Panel */}
                        {selectedDate && (
                            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xl animate-slide-up">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-stone-400" />
                                        {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                                    </h4>
                                    <button onClick={() => setSelectedDate(null)}><X className="w-4 h-4 text-stone-400" /></button>
                                </div>
                                <div className="space-y-3">
                                    {getTransactionsForDate(new Date(selectedDate)).length === 0 ? (
                                        <p className="text-center py-4 text-stone-400 text-[11px] italic">Tidak ada transaksi.</p>
                                    ) : (
                                        getTransactionsForDate(new Date(selectedDate)).map(t => (
                                            <div key={t.id} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                                                <div className="truncate flex-1 pr-4">
                                                    <p className="text-xs font-bold text-stone-800 truncate">{t.description}</p>
                                                    <p className="text-[9px] text-stone-500 font-bold">{t.category} <span className="text-stone-300 ml-1">#{t.id}</span></p>
                                                    <div className="mt-1">
                                                        {(t.actIncome > 0 || t.planIncome > 0) && <p className="text-emerald-600 font-black text-[11px]">+{formatCurrency(t.actIncome || t.planIncome)}</p>}
                                                        {(t.actExpense > 0 || t.planExpense > 0) && <p className="text-rose-600 font-black text-[11px]">-{formatCurrency(t.actExpense || t.planExpense)}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setOpenActionId(openActionId === t.id ? null : t.id); }}
                                                        className={cn("p-1.5 rounded-lg active-shrink transition-all border border-stone-100", openActionId === t.id ? "bg-stone-200 text-stone-600" : "text-stone-400 hover:text-stone-600 bg-white")}
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openActionId === t.id && (
                                                        <div
                                                            className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px] animate-fade-in"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => { handleEditClick(t as any); setOpenActionId(null); }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { handleDeleteClick(t.id); setOpenActionId(null); }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* View: About */}
                {viewMode === 'about' && (
                    <div className="pb-24">
                        <AboutView appVersion={appVersion} />
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-stone-200 px-6 py-2 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 pb-safe">
                <div className="flex justify-between items-center max-w-sm mx-auto">
                    <button
                        onClick={() => setViewModeWithSideEffects('table')}
                        className={cn("flex flex-col items-center p-2 rounded-xl transition-all active-shrink", viewMode === 'table' ? "text-stone-800" : "text-stone-400")}
                    >
                        <div className={cn("p-1.5 rounded-xl mb-1 transition-all", viewMode === 'table' ? "bg-stone-100" : "")}>
                            <List className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight">Data</span>
                    </button>

                    <button
                        onClick={() => setViewModeWithSideEffects('analytics')}
                        className={cn("flex flex-col items-center p-2 rounded-xl transition-all active-shrink", viewMode === 'analytics' ? "text-stone-800" : "text-stone-400")}
                    >
                        <div className={cn("p-1.5 rounded-xl mb-1 transition-all", viewMode === 'analytics' ? "bg-stone-100" : "")}>
                            <PieIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight">Grafik</span>
                    </button>

                    <button
                        onClick={() => setViewModeWithSideEffects('calendar')}
                        className={cn("flex flex-col items-center p-2 rounded-xl transition-all active-shrink", viewMode === 'calendar' ? "text-stone-800" : "text-stone-400")}
                    >
                        <div className={cn("p-1.5 rounded-xl mb-1 transition-all", viewMode === 'calendar' ? "bg-stone-100" : "")}>
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight">Waktu</span>
                    </button>

                    <button
                        onClick={() => setViewModeWithSideEffects('budget')}
                        className={cn("flex flex-col items-center p-2 rounded-xl transition-all active-shrink", viewMode === 'budget' ? "text-stone-800" : "text-stone-400")}
                    >
                        <div className={cn("p-1.5 rounded-xl mb-1 transition-all", viewMode === 'budget' ? "bg-emerald-100" : "")}>
                            <Target className={cn("w-6 h-6", viewMode === 'budget' ? "text-emerald-600" : "")} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight">Budget</span>
                    </button>

                    <button
                        onClick={() => setViewModeWithSideEffects('about')}
                        className={cn("flex flex-col items-center p-2 rounded-xl transition-all active-shrink", viewMode === 'about' ? "text-stone-800" : "text-stone-400")}
                    >
                        <div className={cn("p-1.5 rounded-xl mb-1 transition-all", viewMode === 'about' ? "bg-stone-100" : "")}>
                            <Info className={cn("w-6 h-6", viewMode === 'about' ? "text-stone-600" : "")} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight">Tentang</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Modal: Add / Edit Transaction */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setIsModalOpen(false); setEditMode(null); }}></div>
                    <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up-bounce overflow-hidden">
                        <div className="px-6 pt-6 pb-4">
                            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5 sm:hidden"></div>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-stone-800">{editMode ? 'Edit Transaksi' : 'Transaksi Baru'}</h2>
                                <button onClick={() => { setIsModalOpen(false); setEditMode(null); }} className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                                    <X className="w-5 h-5 text-stone-400" />
                                </button>
                            </div>
                        </div>

                        {!editMode && (
                            <div className="px-6 pb-4">
                                <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => { setMobileModalType('income'); setNewTrans({ ...newTrans, planIncome: '', planExpense: '' }); }}
                                        className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                            mobileModalType === 'income' ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "text-stone-400")}>
                                        <TrendingUp className="w-4 h-4" /> Pemasukan
                                    </button>
                                    <button type="button" onClick={() => { setMobileModalType('expense'); setNewTrans({ ...newTrans, planIncome: '', planExpense: '' }); }}
                                        className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all",
                                            mobileModalType === 'expense' ? "bg-rose-500 text-white shadow-md shadow-rose-200" : "text-stone-400")}>
                                        <TrendingDown className="w-4 h-4" /> Pengeluaran
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveTransaction} className="px-6 pb-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Tanggal</label>
                                    <input type="date" required value={newTrans.date} onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Kategori</label>
                                    <select value={newTrans.category} onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value as TransactionCategory })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-400">
                                        {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Keterangan</label>
                                <input type="text" required placeholder={editMode ? "Keterangan transaksi" : "Nongkrong, Belanja, Gaji..."} value={newTrans.description} onChange={(e) => setNewTrans({ ...newTrans, description: e.target.value })} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-400" />
                            </div>

                            {editMode ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-emerald-500 uppercase">Rencana Masuk</label>
                                        <input type="text" placeholder="0" value={newTrans.planIncome} onChange={(e) => handleCurrencyInput('planIncome', e.target.value)} className="w-full p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold text-emerald-600" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-rose-500 uppercase">Rencana Keluar</label>
                                        <input type="text" placeholder="0" value={newTrans.planExpense} onChange={(e) => handleCurrencyInput('planExpense', e.target.value)} className="w-full p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 text-right font-bold text-rose-600" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className={cn("text-[10px] font-bold uppercase tracking-wider", mobileModalType === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                        Nominal {mobileModalType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </label>
                                    <div className={cn("flex items-center gap-2 rounded-xl border p-2.5", mobileModalType === 'income' ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200")}>
                                        <span className={cn("text-sm font-bold", mobileModalType === 'income' ? "text-emerald-500" : "text-rose-500")}>Rp</span>
                                        <input type="text" placeholder="0" inputMode="numeric"
                                            value={mobileModalType === 'income' ? newTrans.planIncome : newTrans.planExpense}
                                            onChange={(e) => handleCurrencyInput(mobileModalType === 'income' ? 'planIncome' : 'planExpense', e.target.value)}
                                            className={cn("flex-1 bg-transparent outline-none text-right font-bold text-lg", mobileModalType === 'income' ? "text-emerald-700" : "text-rose-700")} />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className={cn("w-full py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 text-white shadow-lg transition-all active:scale-[0.98]",
                                editMode ? "bg-stone-800 hover:bg-stone-900 shadow-stone-200" :
                                    mobileModalType === 'income' ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" : "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                            )}>
                                <CheckCircle2 className="w-5 h-5" />
                                {editMode ? 'Simpan Perubahan' : `Simpan ${mobileModalType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {
                confirmModal.open && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}></div>
                        <div className="relative bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6 animate-scale-in">
                            <div className="flex flex-col items-center text-center">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center mb-4",
                                    confirmModal.type === 'danger' ? "bg-rose-50 text-rose-500" :
                                        confirmModal.type === 'success' ? "bg-emerald-50 text-emerald-500" :
                                            "bg-indigo-50 text-indigo-500"
                                )}>
                                    {confirmModal.type === 'danger' ? <Trash2 className="w-6 h-6" /> :
                                        confirmModal.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                                            <Info className="w-6 h-6" />}
                                </div>
                                <h3 className="text-lg font-bold text-stone-800 mb-2">{confirmModal.title}</h3>
                                <p className="text-xs text-stone-500 mb-6">{confirmModal.message}</p>
                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                        className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold active:bg-stone-50 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={confirmModal.action}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl text-white text-xs font-bold active:scale-[0.98] transition-all",
                                            confirmModal.type === 'danger' ? "bg-rose-600 shadow-rose-200" :
                                                confirmModal.type === 'success' ? "bg-emerald-600 shadow-emerald-200" :
                                                    "bg-stone-800 shadow-stone-200",
                                            "shadow-lg"
                                        )}
                                    >
                                        {confirmModal.type === 'danger' ? 'Hapus' : 'Lanjutkan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Budget Edit Modal (Mobile) */}
            {budgetEditModal.open && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setBudgetEditModal({ ...budgetEditModal, open: false })}></div>
                    <div className="relative bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl shadow-2xl border-t border-white/20 modal-animate-up overflow-hidden">
                        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-500" />
                                Set Budget Limit
                            </h3>
                            <button onClick={() => setBudgetEditModal({ ...budgetEditModal, open: false })}>
                                <X className="w-5 h-5 text-stone-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{budgetEditModal.category}</p>
                                <p className="text-xs text-stone-500">Berapa batas pengeluaran untuk kategori ini di {currentMonthYear}?</p>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 font-mono">Rp</span>
                                <input
                                    autoFocus
                                    type="number"
                                    inputMode="numeric"
                                    value={editBudgetLimit}
                                    onChange={(e) => setEditBudgetLimit(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-xl font-bold text-stone-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    onUpdateBudget(budgetEditModal.category, parseFloat(editBudgetLimit) || 0);
                                    setBudgetEditModal({ ...budgetEditModal, open: false });
                                }}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                            >
                                Simpan Limit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Exit Confirmation Modal ─── */}
            {exitConfirmOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                    {/* Dimmed backdrop */}
                    <div
                        className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setExitConfirmOpen(false)}
                    />
                    {/* Card */}
                    <div className="relative bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                        {/* Top accent bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 to-orange-400" />
                        <div className="p-6 flex flex-col items-center text-center gap-4">
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                                <LogOut className="w-7 h-7 text-rose-500" />
                            </div>
                            {/* Text */}
                            <div>
                                <h3 className="text-lg font-black text-stone-800 mb-1">Keluar Aplikasi?</h3>
                                <p className="text-xs text-stone-400 leading-relaxed">
                                    Semua data tersimpan secara lokal.
                                    <br />Yakin ingin keluar sekarang?
                                </p>
                            </div>
                            {/* Buttons */}
                            <div className="flex w-full gap-3 pt-1">
                                <button
                                    onClick={() => setExitConfirmOpen(false)}
                                    className="flex-1 py-3 rounded-2xl border-2 border-stone-200 text-stone-600 text-sm font-bold active:bg-stone-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        setExitConfirmOpen(false);
                                        const { App } = await import('@capacitor/app');
                                        App.exitApp();
                                    }}
                                    className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shadow-lg shadow-rose-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
