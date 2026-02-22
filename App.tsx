import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Trash2, FileJson, Table, Plus, X, Calendar, Type, TrendingUp, TrendingDown, CheckCircle2, Upload, RefreshCw, Github, FolderOpen, Filter, XCircle, Bell, FileText, Download, HardDrive, Sparkles, Moon, Sun, Search, LayoutGrid, List, PieChart as PieIcon, Save, Monitor, Palette, ArrowRight, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Transaction, CalculatedTransaction, TransactionCategory } from './types';
import { formatCurrency, parseCurrency, parseDateValue, formatDateToDisplay } from './utils/formatters';
import { exportToExcel, importFromExcel } from './utils/excel';
import { CATEGORIES } from './constants';
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SavedFile {
    id: number;
    name: string;
    date: string;
    itemCount: number;
    data: Transaction[];
}

type ViewMode = 'table' | 'calendar' | 'analytics';

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Config State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [compactMode, setCompactMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Metadata & Updates
  const [appVersion, setAppVersion] = useState('2.0.0');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [remoteChangelog, setRemoteChangelog] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // File Manager State
  const [showFileManager, setShowFileManager] = useState(false);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [fileNameInput, setFileNameInput] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'open'>('open');
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

  // New Transaction Form State
  const [newTrans, setNewTrans] = useState({
    date: '', 
    description: '',
    category: 'Lainnya' as TransactionCategory,
    planIncome: '',
    planExpense: ''
  });

  // Hidden inputs refs
  const fileExcelRef = useRef<HTMLInputElement>(null);
  const fileJsonRef = useRef<HTMLInputElement>(null);

  // --- KEYBOARD SHORTCUTS ---
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
  }, [fileHandle, transactions]); // Depend on transactions to save latest

  // --- INIT LOAD ---
  useEffect(() => {
    fetch('./metadata.json').then(res => res.ok ? res.json() : null).then(localMeta => {
        if(localMeta) {
            setAppVersion(localMeta.version);
            // Check remote logic here (omitted for brevity, same as before)
        }
    });

    const saved = localStorage.getItem('luxury_cashflow_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTransactions(parsed);
      } catch (e) { setTransactions([]); }
    }

    const files = localStorage.getItem('ohmonsea_saved_files');
    if (files) {
        try { setSavedFiles(JSON.parse(files)); } catch (e) { setSavedFiles([]); }
    }
    
    // Load User Preferences
    const pref = localStorage.getItem('ohmonsea_prefs');
    if(pref) {
        const p = JSON.parse(pref);
        setCompactMode(p.compactMode ?? false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('luxury_cashflow_data', JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  // Save Prefs
  useEffect(() => {
      localStorage.setItem('ohmonsea_prefs', JSON.stringify({ compactMode }));
      
      // Apply static light theme
      document.body.className = "antialiased transition-colors duration-300 bg-stone-50 text-stone-900";
      document.documentElement.classList.remove('dark');
  }, [compactMode]);

  useEffect(() => {
      if (!loading) localStorage.setItem('ohmonsea_saved_files', JSON.stringify(savedFiles));
  }, [savedFiles, loading]);


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

  // --- FILTER & SEARCH ---
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

    // 2. Date Filter
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
  }, [calculatedData, dateFilter, searchQuery]);

  const totals = useMemo(() => {
    const finalEstBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].estBalance : 0;
    const finalActBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].actBalance : 0;
    
    // Monthly Summary (Simplified based on filter)
    const income = filteredData.reduce((acc, curr) => acc + (curr.actIncome || curr.planIncome), 0);
    const expense = filteredData.reduce((acc, curr) => acc + (curr.actExpense || curr.planExpense), 0);
    
    return { finalEstBalance, finalActBalance, periodIncome: income, periodExpense: expense };
  }, [calculatedData, filteredData]);

  // --- ANALYTICS DATA ---
  const analyticsData = useMemo(() => {
      // 1. Pie Chart Data (Expenses by Category)
      const catMap = new Map<string, number>();
      filteredData.forEach(t => {
          const exp = t.actExpense || t.planExpense;
          if (exp > 0) {
              catMap.set(t.category, (catMap.get(t.category) || 0) + exp);
          }
      });
      const pieData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

      // 2. Area Chart Data (Balance History)
      const areaData = filteredData.map(t => ({
          name: t.date,
          saldo: t.actBalance,
          est: t.estBalance
      }));

      return { pieData, areaData };
  }, [filteredData]);

  // --- HANDLERS ---
  const handleUpdate = (id: number, field: keyof Transaction, value: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleCurrencyInput = (field: 'planIncome' | 'planExpense', value: string) => {
    const numericStr = value.replace(/[^0-9]/g, '');
    if (!numericStr) { setNewTrans({ ...newTrans, [field]: '' }); return; }
    setNewTrans({ ...newTrans, [field]: formatCurrency(Number(numericStr)) });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.date || !newTrans.description) { alert("Wajib diisi!"); return; }

    const newTransactionItem: Transaction = {
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

    setTransactions(prev => {
        const unsorted = [...prev, newTransactionItem];
        return unsorted.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date)).map((item, index) => ({...item, id: index + 1}));
    });

    setNewTrans({ date: '', description: '', category: 'Lainnya', planIncome: '', planExpense: '' });
    setIsModalOpen(false);
  };

  // --- FILE SYSTEM ACCESS API ---
  const handleQuickSave = async () => {
    if (!fileHandle) return;
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(transactions, null, 2));
        await writable.close();
        alert("Perubahan tersimpan ke file lokal!");
    } catch (err) {
        console.error(err);
        alert("Gagal menyimpan otomatis. Izin mungkin dicabut.");
    }
  };

  const handleSaveToDisk = async () => {
    try {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
            suggestedName: `OhMonsea_Plan_${new Date().toISOString().slice(0,10)}.json`,
            types: [{ description: 'JSON File', accept: {'application/json': ['.json']} }],
        });
        setFileHandle(handle);
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(transactions, null, 2));
        await writable.close();
        setShowFileManager(false);
        alert("File berhasil disimpan! Anda sekarang bisa menekan Ctrl+S untuk menyimpan perubahan langsung ke file ini.");
    } catch (err) {
        // User cancelled or API not supported
        if ((err as Error).name !== 'AbortError') {
             handleJsonExport(); // Fallback
        }
    }
  };

  const handleSaveInternal = () => {
      if (!fileNameInput.trim()) return alert("Masukkan nama file!");
      const newFile: SavedFile = { id: Date.now(), name: fileNameInput, date: new Date().toISOString(), itemCount: transactions.length, data: [...transactions] };
      setSavedFiles(prev => {
          const exists = prev.findIndex(f => f.name.toLowerCase() === fileNameInput.toLowerCase());
          if (exists >= 0) {
              if (!confirm(`Timpa "${fileNameInput}"?`)) return prev;
              const updated = [...prev]; updated[exists] = newFile; return updated;
          }
          return [newFile, ...prev];
      });
      setFileNameInput(''); setActiveTab('open');
  };

  const handleJsonExport = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OhMonsea_Backup.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files?.[0]) {
         const data = await importFromExcel(e.target.files[0]);
         if(confirm(`Load ${data.length} baris?`)) setTransactions(data.map((item, i) => ({...item, id: i + 1, category: 'Lainnya'})));
     }
  };

  // Helper Styles based on theme
  // Removed dynamic theme logic
  
  // Dynamic classes for Primary UI elements
  const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";

  const textPrimaryClass = "text-stone-700";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 z-20 shadow-sm shrink-0 transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                {/* Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <div className={cn("p-1.5 rounded-lg shadow-lg transition-colors", btnPrimaryClass)}>
                            <LayoutDashboard className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-stone-900 font-serif tracking-tight">OhMonsea Plan</h1>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                                Finance OS v{appVersion}
                            </p>
                        </div>
                    </div>
                    {/* View Switcher (Desktop) */}
                    <div className="hidden md:flex bg-stone-100 p-1 rounded-lg ml-6">
                        <button onClick={() => setViewMode('table')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === 'table' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700")}>
                            <List className="w-3.5 h-3.5" /> Data
                        </button>
                        <button onClick={() => setViewMode('analytics')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === 'analytics' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700")}>
                            <PieIcon className="w-3.5 h-3.5" /> Analitik
                        </button>
                         <button onClick={() => setViewMode('calendar')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === 'calendar' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700")}>
                            <Calendar className="w-3.5 h-3.5" /> Kalender
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Global Search */}
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-600 transition-colors" />
                        <input 
                            id="global-search"
                            type="text" 
                            placeholder="Cari transaksi... (Ctrl+K)" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-xs focus:ring-2 focus:ring-stone-400 outline-none text-stone-700 placeholder-stone-400 transition-all"
                        />
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 self-end md:self-auto ml-auto">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className={cn("flex items-center px-4 py-2 text-xs rounded-full transition-all hover:scale-105 active:scale-95", btnPrimaryClass)}
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">Tambah</span>
                        </button>

                        <button 
                            onClick={() => { setShowFileManager(true); setActiveTab('open'); }}
                            className="flex items-center px-3 py-2 text-xs font-medium text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 rounded-md shadow-sm transition-colors"
                        >
                            <FolderOpen className={cn("w-3.5 h-3.5 sm:mr-1.5", textPrimaryClass)} />
                            <span className="hidden sm:inline">File</span>
                        </button>

                         <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-md transition-colors ml-1" title="Pengaturan">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-stone-50 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Balance */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative overflow-hidden group">
                  <div className={cn("absolute right-0 top-0 p-3 opacity-10 rounded-bl-xl", btnPrimaryClass)}>
                      <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sisa Saldo Aktual</p>
                  <h3 className={cn("text-xl font-bold mt-1", totals.finalActBalance < 0 ? "text-rose-600" : "text-stone-800")}>
                      {formatCurrency(totals.finalActBalance)}
                  </h3>
                  <div className="mt-2 text-[10px] text-stone-500">
                      Est: {formatCurrency(totals.finalEstBalance)}
                  </div>
              </div>

               {/* Card 2: Period Summary */}
               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                   <div className="flex justify-between items-end">
                       <div>
                           <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Masuk</p>
                           <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodIncome)}</p>
                       </div>
                       <div className="text-right">
                           <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Keluar</p>
                           <p className="font-bold text-stone-700 text-sm">{formatCurrency(totals.periodExpense)}</p>
                       </div>
                   </div>
                   {/* Progress Bar Income vs Expense */}
                   <div className="w-full bg-stone-100 h-1.5 mt-3 rounded-full overflow-hidden flex">
                       <div className="bg-rose-500 h-full" style={{ width: `${Math.min((totals.periodExpense / (totals.periodIncome || 1)) * 100, 100)}%` }}></div>
                   </div>
               </div>

                {/* Card 4: Savings Goal (Mockup) */}
               <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                   <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Target: Laptop Baru</p>
                        <span className="text-[10px] font-bold text-indigo-500">45%</span>
                   </div>
                   <h3 className="text-sm font-bold text-stone-700">{formatCurrency(totals.finalActBalance)} <span className="text-[10px] text-stone-400 font-normal">/ 15 Juta</span></h3>
                   <div className="w-full bg-stone-100 h-2 mt-2 rounded-full overflow-hidden">
                       <div className={cn("h-full rounded-full", btnPrimaryClass)} style={{ width: '45%' }}></div>
                   </div>
               </div>
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col relative bg-stone-50">
        
        {/* VIEW: TABLE */}
        {viewMode === 'table' && (
            <div className="bg-white rounded-lg shadow-xl shadow-stone-200/50 border border-stone-200 flex flex-col h-full relative z-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <table className="w-full text-xs border-collapse table-fixed">
                        <thead className="bg-stone-100 text-stone-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="w-[3%] p-3 text-center border-b border-r border-stone-200">ID</th>
                                <th className="w-[8%] p-3 text-left border-b border-r border-stone-200">Tanggal</th>
                                <th className="w-[19%] p-3 text-left border-b border-r border-stone-200">Keterangan</th>
                                <th className="w-[8%] p-3 text-left border-b border-r border-stone-200">Kategori</th>
                                <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-emerald-50/50 text-emerald-700 hidden sm:table-cell">Renc Masuk</th>
                                <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-rose-50/50 text-rose-700 hidden sm:table-cell">Renc Keluar</th>
                                <th className="w-[9%] p-3 text-right border-b border-r border-stone-200 bg-stone-100 text-stone-700 font-bold hidden sm:table-cell">Est Saldo</th>
                                <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-emerald-100/30 text-emerald-800">Akt Masuk</th>
                                <th className="w-[9%] p-3 text-right border-b border-stone-200 bg-rose-100/30 text-rose-800">Akt Keluar</th>
                                <th className="w-[9%] p-3 text-right border-b border-r border-stone-200 bg-stone-100 text-stone-800 font-bold">Saldo Akt</th>
                                <th className="w-[8%] p-3 text-right border-b border-stone-200">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredData.map(row => (
                                <tr key={row.id} className={cn("group hover:bg-stone-100 transition-colors duration-200", compactMode ? "h-10" : "h-12")}>
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
                                    <td className="p-0 border-stone-100 hidden sm:table-cell"><input type="text" value={row.planIncome ? formatCurrency(row.planIncome) : ''} onChange={(e) => handleUpdate(row.id, 'planIncome', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-stone-500 font-mono" placeholder="0"/></td>
                                    <td className="p-0 border-stone-100 hidden sm:table-cell"><input type="text" value={row.planExpense ? formatCurrency(row.planExpense) : ''} onChange={(e) => handleUpdate(row.id, 'planExpense', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-stone-500 font-mono" placeholder="0"/></td>
                                    <td className="p-0 border-r border-stone-100 bg-stone-50/50 hidden sm:table-cell"><div className="flex items-center justify-end h-full px-3 text-stone-700 font-mono font-bold">{formatCurrency(row.estBalance)}</div></td>
                                    
                                    <td className="p-0 border-stone-100"><input type="text" value={row.actIncome ? formatCurrency(row.actIncome) : ''} onChange={(e) => handleUpdate(row.id, 'actIncome', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-emerald-600 font-bold font-mono" placeholder="0"/></td>
                                    <td className="p-0 border-stone-100"><input type="text" value={row.actExpense ? formatCurrency(row.actExpense) : ''} onChange={(e) => handleUpdate(row.id, 'actExpense', parseCurrency(e.target.value))} className="w-full h-full px-3 bg-transparent outline-none text-right text-rose-600 font-bold font-mono" placeholder="0"/></td>
                                    <td className="p-0 border-r border-stone-100 bg-stone-50/50"><div className="flex items-center justify-end h-full px-3 text-stone-800 font-mono font-bold">{formatCurrency(row.actBalance)}</div></td>
                                    <td className={cn("p-0 text-right px-3 font-mono font-medium text-xs", row.difference > 0 ? "text-emerald-600" : row.difference < 0 ? "text-rose-600" : "text-stone-300")}>
                                        {formatCurrency(row.difference)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Floating Fab for Filter */}
                <div className="md:hidden fixed bottom-20 right-4">
                    <button onClick={() => setCompactMode(!compactMode)} className="bg-stone-800 text-white p-3 rounded-full shadow-lg">
                        {compactMode ? <Monitor className="w-5 h-5"/> : <List className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        )}

        {/* VIEW: ANALYTICS (CHARTS) */}
        {viewMode === 'analytics' && (
            <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                {/* Pie Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col">
                    <h3 className="text-sm font-bold text-stone-700 mb-4">Pengeluaran per Kategori</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={analyticsData.pieData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {analyticsData.pieData.map((entry, index) => {
                                        // Match color logic roughly
                                        const colors = ['#10b981', '#3b82f6', '#f97316', '#ef4444', '#a855f7', '#14b8a6', '#64748b'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />;
                                    })}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Area Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col">
                    <h3 className="text-sm font-bold text-stone-700 mb-4">Pertumbuhan Saldo</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.areaData}>
                                <defs>
                                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#44403c" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#44403c" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" opacity={0.5} />
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#78716c'}} tickLine={false} axisLine={false} />
                                <YAxis hide domain={['auto', 'auto']} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                                <Area type="monotone" dataKey="saldo" stroke="#44403c" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={2} />
                                <Area type="monotone" dataKey="est" stroke="#a8a29e" strokeDasharray="5 5" fill="transparent" strokeWidth={1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: CALENDAR */}
        {viewMode === 'calendar' && (
            <div className="bg-white rounded-lg shadow-sm border border-stone-200 h-full overflow-y-auto p-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredData.map(t => (
                        <div key={t.id} className="bg-stone-50 border border-stone-100 p-3 rounded-lg hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-stone-500 bg-white px-2 py-1 rounded shadow-sm">{t.date}</span>
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider", 
                                    CATEGORIES.find(c => c.name === t.category)?.color
                                )}>{t.category}</span>
                            </div>
                            <h4 className="font-bold text-sm text-stone-800 truncate" title={t.description}>{t.description}</h4>
                            <div className="mt-2 flex justify-between items-end">
                                <div className="text-right w-full">
                                    {(t.actIncome > 0 || t.planIncome > 0) && (
                                        <p className="text-xs text-emerald-600 font-bold">+ {formatCurrency(t.actIncome || t.planIncome)}</p>
                                    )}
                                    {(t.actExpense > 0 || t.planExpense > 0) && (
                                        <p className="text-xs text-rose-600 font-bold">- {formatCurrency(t.actExpense || t.planExpense)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )}
      </main>

      {/* --- ADD TRANSACTION MODAL --- */}
      {isModalOpen && (
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
                            <input type="date" required value={newTrans.date} onChange={(e) => setNewTrans({...newTrans, date: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">Kategori</label>
                            <select value={newTrans.category} onChange={(e) => setNewTrans({...newTrans, category: e.target.value as TransactionCategory})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400">
                                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase">Keterangan</label>
                        <input type="text" required placeholder="Contoh: Beli Kopi" value={newTrans.description} onChange={(e) => setNewTrans({...newTrans, description: e.target.value})} className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-stone-400" />
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
      )}

      {/* --- FILE MANAGER MODAL --- */}
      {showFileManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setShowFileManager(false)}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-white/50 modal-animate flex flex-col max-h-[85vh]">
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2"><FolderOpen className="w-5 h-5 text-stone-500" /> File Manager</h2>
                    <button onClick={() => setShowFileManager(false)}><X className="w-5 h-5 text-stone-400" /></button>
                </div>
                
                <div className="flex border-b border-stone-200">
                    <button onClick={() => setActiveTab('open')} className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === 'open' ? "border-stone-600 text-stone-600 bg-stone-50" : "border-transparent text-stone-500 hover:text-stone-700")}>Buka File</button>
                    <button onClick={() => setActiveTab('save')} className={cn("flex-1 py-3 text-sm font-medium transition-colors border-b-2", activeTab === 'save' ? "border-stone-600 text-stone-600 bg-stone-50" : "border-transparent text-stone-500 hover:text-stone-700")}>Simpan / Ekspor</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-stone-50/30">
                    {activeTab === 'open' ? (
                        <div className="space-y-4">
                            {/* Saved Files List (Internal) */}
                            {savedFiles.map(file => (
                                <div key={file.id} className="bg-white p-3 rounded-lg border border-stone-200 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-sm text-stone-800">{file.name}</h3>
                                        <p className="text-[10px] text-stone-500">{new Date(file.date).toLocaleDateString()} • {file.itemCount} Item</p>
                                    </div>
                                    <button onClick={() => { setTransactions(file.data); setShowFileManager(false); }} className={cn("px-3 py-1.5 text-xs rounded-md", btnPrimaryClass)}>Buka</button>
                                </div>
                            ))}
                            <div className="border-t border-stone-200 pt-4 mt-4">
                                <input type="file" ref={fileJsonRef} accept=".json" className="hidden" onChange={(e) => {
                                    if(e.target.files?.[0]) {
                                        const r = new FileReader();
                                        r.onload = (ev) => { try { setTransactions(JSON.parse(ev.target?.result as string)); setShowFileManager(false); } catch(err){alert("Invalid JSON")} };
                                        r.readAsText(e.target.files[0]);
                                    }
                                }} />
                                <input type="file" ref={fileExcelRef} accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => fileJsonRef.current?.click()} className="p-3 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-50"><FileJson className="w-4 h-4"/> Import JSON</button>
                                    <button onClick={() => fileExcelRef.current?.click()} className="p-3 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-50"><Table className="w-4 h-4 text-emerald-500"/> Import Excel</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Native FS API Save */}
                             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2"><HardDrive className="w-4 h-4"/> Simpan ke Perangkat (Google Drive)</h3>
                                <p className="text-[11px] text-indigo-700 mb-3 leading-relaxed">
                                    Fitur Pro: Simpan file langsung ke folder Google Drive di PC Anda. Tekan <b>Ctrl+S</b> nanti untuk menyimpan perubahan instan.
                                </p>
                                <button onClick={handleSaveToDisk} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-all">
                                    Pilih Lokasi Simpan (Save As)
                                </button>
                             </div>

                             <div className="relative">
                                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                                 <div className="relative flex justify-center text-xs uppercase"><span className="bg-stone-50 px-2 text-stone-500">Atau Simpan di Browser</span></div>
                             </div>

                             <div className="flex gap-2">
                                <input type="text" placeholder="Nama File..." value={fileNameInput} onChange={(e) => setFileNameInput(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm" />
                                <button onClick={handleSaveInternal} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-bold">Simpan</button>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3 pt-2">
                                <button onClick={handleJsonExport} className="flex items-center justify-center gap-2 p-3 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100"><Download className="w-4 h-4"/> Download JSON</button>
                                <button onClick={() => exportToExcel(filteredData)} className="flex items-center justify-center gap-2 p-3 border border-stone-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50"><Table className="w-4 h-4"/> Download Excel</button>
                             </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-xs text-stone-400">
                    <span>OhMonsea Finance v{appVersion}</span>
                </div>
            </div>
        </div>
      )}
      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden">
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2"><Settings className="w-5 h-5 text-stone-500" /> Pengaturan</h2>
                    <button onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Theme Selector Removed */}
                    
                    <div className="pt-4">
                        <h3 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2"><HardDrive className="w-4 h-4"/> Data</h3>
                        <button 
                            onClick={() => { if(confirm("Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.")) { setTransactions([]); localStorage.removeItem('luxury_cashflow_data'); setIsSettingsOpen(false); } }} 
                            className="w-full py-2 px-4 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Reset Semua Data
                        </button>
                    </div>
                </div>
                
                <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-center">
                    <p className="text-[10px] text-stone-400">OhMonsea Finance v{appVersion}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}