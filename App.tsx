import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUp, ArrowDown, Trash2, X } from 'lucide-react';
import { MobileView } from './components/mobile/MobileView';
import { Transaction, TransactionCategory } from './types';
import { formatCurrency, parseCurrency, formatDateToDisplay, parseDateValue } from './utils/formatters';
import { exportToExcel } from './utils/excel';
import { generateFinancePDF } from './utils/pdfGenerator';
import { CATEGORIES } from './constants';

// Hooks
import { useTransactions } from './hooks/useTransactions';
import { useAppConfig } from './hooks/useAppConfig';
import { useFileManager } from './hooks/useFileManager';
import { useCalendar } from './hooks/useCalendar';
import { useAnalytics, DateRange } from './hooks/useAnalytics';
import { useBudgets } from './hooks/useBudgets';
import { useCategories } from './hooks/useCategories';
import { useToast } from './components/ui/ToastProvider';

// Components
import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { TransactionTable } from './components/dashboard/TransactionTable';
import { AnalyticsView } from './components/views/AnalyticsView';
import { CalendarView } from './components/views/CalendarView';
import { BudgetView } from './components/views/BudgetView';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { FileManagerModal } from './components/modals/FileManagerModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { UpdateModal } from './components/modals/UpdateModal';
import { ExportSelectionModal } from './components/modals/ExportSelectionModal';
import { SplashScreen } from './components/SplashScreen';
import { AboutView } from './components/views/AboutView';

export function App() {
    const {
        viewMode, setViewMode, compactMode, setCompactMode, searchQuery, setSearchQuery,
        isModalOpen, setIsModalOpen, isSettingsOpen, setIsSettingsOpen, appVersion,
        versionHistory, updateAvailable, remoteVersion, remoteChangelog, githubInfo,
        isUpdateModalOpen, setIsUpdateModalOpen, showUpdateToast, setShowUpdateToast, isMobile
    } = useAppConfig();

    const { toast } = useToast();
    const { allCategories } = useCategories();

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });

    const {
        transactions, setTransactions, loading, filteredData, totals, calculatedData,
        handleUpdate, handleUpdateRow, handleDelete, handleAddRow, addTransaction, resetData,
        groupBy, setGroupBy, categoryFilter, setCategoryFilter,
        undo, redo, canUndo, canRedo
    } = useTransactions(searchQuery);

    const {
        showFileManager, setShowFileManager, savedFiles, fileNameInput, setFileNameInput,
        activeTab, setActiveTab, fileHandle, handleQuickSave, handleSaveToDisk,
        handleSaveInternal, handleJsonExport, handleExcelImport
    } = useFileManager(transactions, setTransactions, calculatedData, toast);

    const {
        calendarDate, setCalendarDate, selectedDate, setSelectedDate,
        calendarGrid, getTransactionsForDate, handlePrevMonth, handleNextMonth, monthNames
    } = useCalendar(transactions);

    const currentMonthYear = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    const { budgets, updateBudget } = useBudgets(currentMonthYear);

    const onExportPDF = () => {
        setIsExportModalOpen(true);
    };

    const handleConfirmExport = (selectedMonths: string[]) => {
        // Filter transactions based on selected months
        const exportTransactions = calculatedData.filter(t => {
            if (!t.date) return false;
            const d = new Date(parseDateValue(t.date));
            if (isNaN(d.getTime())) return false;
            const monthYear = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            return selectedMonths.includes(monthYear);
        });

        // Recalculate totals for selected months
        const periodIncome = exportTransactions.reduce((acc, curr) => acc + (curr.actIncome || curr.planIncome || 0), 0);
        const periodExpense = exportTransactions.reduce((acc, curr) => acc + (curr.actExpense || curr.planExpense || 0), 0);

        const finalActBalance = exportTransactions.length > 0 ? exportTransactions[exportTransactions.length - 1].actBalance : 0;
        const finalEstBalance = exportTransactions.length > 0 ? exportTransactions[exportTransactions.length - 1].estBalance : 0;

        generateFinancePDF({
            transactions: exportTransactions,
            totals: {
                finalEstBalance,
                finalActBalance,
                periodIncome,
                periodExpense
            },
            appVersion,
            title: selectedMonths.length === 1 ? `Laporan Keuangan - ${selectedMonths[0]}` : 'Ringkasan Laporan Keuangan Multibulan'
        });

        setIsExportModalOpen(false);
    };

    const analyticsData = useAnalytics(filteredData, calculatedData, dateRange);

    const monthlyTotals = useMemo(() => {
        const now = new Date();
        const thisMonth = calculatedData.filter(t => {
            if (!t.date) return false;
            const d = new Date(parseDateValue(t.date));
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const actIncome = thisMonth.reduce((a, t) => a + (t.actIncome || 0), 0);
        const actExpense = thisMonth.reduce((a, t) => a + (t.actExpense || 0), 0);
        const estIncome = thisMonth.reduce((a, t) => a + (t.planIncome || 0), 0);
        const estExpense = thisMonth.reduce((a, t) => a + (t.planExpense || 0), 0);
        const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return { actIncome, actExpense, estIncome, estExpense, monthLabel };
    }, [calculatedData, parseDateValue]);

    const [newTrans, setNewTrans] = useState({
        date: '',
        description: '',
        category: 'Lainnya' as TransactionCategory,
        planIncome: '',
        planExpense: ''
    });

    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; rowId: number | null }>({
        visible: false, x: 0, y: 0, rowId: null
    });

    const fileExcelRef = useRef<HTMLInputElement>(null);
    const fileJsonRef = useRef<HTMLInputElement>(null);

    // Auto-save to localStorage whenever transactions change
    useEffect(() => {
        if (transactions.length === 0) return;
        localStorage.setItem('ohmonsea_transactions', JSON.stringify(transactions));
        toast('Perubahan tersimpan otomatis', 'info');
    }, [transactions]);

    // Context Menu Handlers
    useEffect(() => {
        const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, rowId: id });
    };

    // Shortcut Handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search')?.focus();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (fileHandle) {
                    handleQuickSave();
                } else {
                    setShowFileManager(true);
                    setActiveTab('save');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fileHandle, handleQuickSave, setShowFileManager, setActiveTab]);

    // Modal Handlers
    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTrans.date || !newTrans.description) { toast('Tanggal & keterangan wajib diisi!', 'warning'); return; }

        const newItem: Transaction = {
            id: transactions.length + 1,
            date: formatDateToDisplay(newTrans.date),
            description: newTrans.description,
            category: newTrans.category,
            planIncome: parseCurrency(newTrans.planIncome),
            planExpense: parseCurrency(newTrans.planExpense),
            actIncome: 0,
            actExpense: 0,
            isNew: true
        };

        addTransaction(newItem);
        setNewTrans({ date: '', description: '', category: 'Lainnya', planIncome: '', planExpense: '' });
        setIsModalOpen(false);
    };

    const handleCurrencyInput = (field: 'planIncome' | 'planExpense', value: string) => {
        const numericStr = value.replace(/[^0-9]/g, '');
        if (!numericStr) { setNewTrans({ ...newTrans, [field]: '' }); return; }
        setNewTrans({ ...newTrans, [field]: formatCurrency(Number(numericStr)) });
    };

    if (loading) return null;

    return (
        <React.Fragment>
            {showSplash && (
                <SplashScreen appVersion={appVersion} onFinish={() => setShowSplash(false)} />
            )}
            <ExportSelectionModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleConfirmExport}
                transactions={transactions}
                monthNames={monthNames}
            />
            <div className="flex flex-col h-full">
                {isMobile ? (
                    <MobileView
                        transactions={transactions}
                        filteredData={filteredData}
                        calculatedData={calculatedData}
                        analyticsData={analyticsData}
                        totals={totals}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onAddRow={handleAddRow}
                        onAddTransaction={handleAddTransaction}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isModalOpen={isModalOpen}
                        setIsModalOpen={setIsModalOpen}
                        newTrans={newTrans}
                        setNewTrans={setNewTrans}
                        handleCurrencyInput={handleCurrencyInput}
                        CATEGORIES={CATEGORIES}
                        calendarDate={calendarDate}
                        setCalendarDate={setCalendarDate}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        monthNames={monthNames}
                        calendarGrid={calendarGrid}
                        getTransactionsForDate={getTransactionsForDate}
                        handlePrevMonth={handlePrevMonth}
                        handleNextMonth={handleNextMonth}
                        formatCurrency={formatCurrency}
                        parseDateValue={parseDateValue}
                        appVersion={appVersion}
                        updateAvailable={updateAvailable}
                        setShowUpdateModal={setIsUpdateModalOpen}
                        setShowFileManager={setShowFileManager}
                        setIsSettingsOpen={setIsSettingsOpen}
                        setActiveTab={setActiveTab}
                        budgets={budgets}
                        onUpdateBudget={updateBudget}
                        onExportPDF={onExportPDF}
                        currentMonthYear={currentMonthYear}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />
                ) : (
                    <>
                        <Header
                            appVersion={appVersion}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setIsModalOpen={setIsModalOpen}
                            setShowFileManager={setShowFileManager}
                            setActiveTab={setActiveTab}
                            setIsSettingsOpen={setIsSettingsOpen}
                            onExportPDF={onExportPDF}
                        />

                        {viewMode !== 'about' && <SummaryCards totals={totals} monthlyTotals={monthlyTotals} />}

                        <main className="flex-1 overflow-hidden w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col relative bg-stone-50">
                            {viewMode === 'table' && (
                                <TransactionTable
                                    filteredData={filteredData}
                                    compactMode={compactMode}
                                    setCompactMode={setCompactMode}
                                    handleUpdate={handleUpdate}
                                    handleUpdateRow={handleUpdateRow}
                                    handleDelete={handleDelete}
                                    handleContextMenu={handleContextMenu}
                                    groupBy={groupBy}
                                    setGroupBy={setGroupBy}
                                    categoryFilter={categoryFilter}
                                    setCategoryFilter={setCategoryFilter}
                                    undo={undo}
                                    redo={redo}
                                    canUndo={canUndo}
                                    canRedo={canRedo}
                                    showToast={toast}
                                    categories={allCategories}
                                />
                            )}

                            {viewMode === 'analytics' && <AnalyticsView analyticsData={analyticsData} dateRange={dateRange} setDateRange={setDateRange} />}

                            {viewMode === 'about' && <AboutView appVersion={appVersion} />}

                            {viewMode === 'budget' && (
                                <BudgetView
                                    budgets={budgets}
                                    filteredData={calculatedData}
                                    updateBudget={updateBudget}
                                    currentMonthYear={currentMonthYear}
                                    handlePrevMonth={handlePrevMonth}
                                    handleNextMonth={handleNextMonth}
                                    monthNames={monthNames}
                                />
                            )}

                            {viewMode === 'calendar' && (
                                <CalendarView
                                    calendarDate={calendarDate}
                                    setCalendarDate={setCalendarDate}
                                    calendarGrid={calendarGrid}
                                    getTransactionsForDate={getTransactionsForDate}
                                    handlePrevMonth={handlePrevMonth}
                                    handleNextMonth={handleNextMonth}
                                    monthNames={monthNames}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                />
                            )}
                        </main>
                    </>
                )}

                <AddTransactionModal
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                    newTrans={newTrans}
                    setNewTrans={setNewTrans}
                    handleCurrencyInput={handleCurrencyInput}
                    handleAddTransaction={handleAddTransaction}
                    categories={allCategories}
                />

                <FileManagerModal
                    showFileManager={showFileManager}
                    setShowFileManager={setShowFileManager}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    savedFiles={savedFiles}
                    setTransactions={setTransactions}
                    fileJsonRef={fileJsonRef}
                    fileExcelRef={fileExcelRef}
                    handleExcelImport={handleExcelImport}
                    handleSaveToDisk={handleSaveToDisk}
                    fileNameInput={fileNameInput}
                    setFileNameInput={setFileNameInput}
                    handleSaveInternal={handleSaveInternal}
                    handleJsonExport={handleJsonExport}
                    exportToExcel={exportToExcel}
                    filteredData={filteredData}
                    appVersion={appVersion}
                    onExportPDF={onExportPDF}
                />

                <SettingsModal
                    isSettingsOpen={isSettingsOpen}
                    setIsSettingsOpen={setIsSettingsOpen}
                    resetData={resetData}
                    appVersion={appVersion}
                    versionHistory={versionHistory}
                />

                <UpdateModal
                    isUpdateModalOpen={isUpdateModalOpen}
                    setIsUpdateModalOpen={setIsUpdateModalOpen}
                    appVersion={appVersion}
                    remoteVersion={remoteVersion}
                    remoteChangelog={remoteChangelog}
                    githubInfo={githubInfo}
                />

                {contextMenu.visible && (
                    <div
                        className="fixed bg-white shadow-xl border border-stone-200 rounded-lg z-50 py-1 min-w-[200px]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button onClick={() => contextMenu.rowId && handleAddRow(contextMenu.rowId, 'above')} className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 flex items-center gap-2">
                            <ArrowUp className="w-3.5 h-3.5" /> Tambah baris diatas
                        </button>
                        <button onClick={() => contextMenu.rowId && handleAddRow(contextMenu.rowId, 'below')} className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 flex items-center gap-2">
                            <ArrowDown className="w-3.5 h-3.5" /> Tambah baris dibawah
                        </button>
                        <div className="h-px bg-stone-100 my-1" />
                        <button onClick={() => contextMenu.rowId && handleDelete(contextMenu.rowId)} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus baris
                        </button>
                    </div>
                )}

                {showUpdateToast && (
                    <div className="fixed bottom-4 right-4 z-50 bg-stone-900 text-white p-4 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-4 animate-slide-up max-w-sm">
                        <div className="flex-1">
                            <h4 className="text-sm font-bold">Update Tersedia!</h4>
                            <p className="text-xs text-stone-400">Versi {remoteVersion} siap diunduh.</p>
                        </div>
                        <button onClick={() => setIsUpdateModalOpen(true)} className="px-3 py-1.5 bg-white text-stone-900 text-xs font-bold rounded-md">Lihat</button>
                        <button onClick={() => setShowUpdateToast(false)} className="p-1 text-stone-400 hover:text-white transition-colors rounded-md hover:bg-white/10" aria-label="Tutup notifikasi">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </React.Fragment>
    );
}