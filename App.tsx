import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Trash2, FileJson, Table, Save, Plus, X, Calendar, Type, TrendingUp, TrendingDown, CheckCircle2, Upload, RefreshCw, Github, FolderOpen, Filter, XCircle, Bell } from 'lucide-react';
import { Transaction, CalculatedTransaction } from './types';
import { formatCurrency, parseCurrency, parseDateValue, formatDateToDisplay } from './utils/formatters';
import { exportToExcel, importFromExcel } from './utils/excel';

// Removed static import of metadata.json to prevent module resolution errors
// import localMetadata from './metadata.json'; 

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Metadata State (Loaded via fetch)
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [githubConfig, setGithubConfig] = useState({ username: '', repo: '', branch: 'main' });

  // Update System State
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // New Transaction Form State
  const [newTrans, setNewTrans] = useState({
    date: '', // YYYY-MM-DD from input type="date"
    description: '',
    planIncome: '',
    planExpense: ''
  });

  // Hidden inputs refs
  const fileExcelRef = useRef<HTMLInputElement>(null);
  const fileJsonRef = useRef<HTMLInputElement>(null);

  // --- LOAD METADATA & CHECK UPDATES ---
  useEffect(() => {
    // 1. Fetch Local Metadata
    fetch('./metadata.json')
        .then(res => {
            if (!res.ok) throw new Error("Failed to load metadata");
            return res.json();
        })
        .then(localMeta => {
            setAppVersion(localMeta.version);
            setGithubConfig(localMeta.github);

            // 2. Check for Updates (Nested to ensure we have local config first)
            const { username, repo, branch } = localMeta.github;
            if (username && username !== "USERNAME_GITHUB_ANDA") {
                fetch(`https://raw.githubusercontent.com/${username}/${repo}/${branch}/metadata.json?nocache=${Date.now()}`)
                    .then(res => res.ok ? res.json() : null)
                    .then(remoteMeta => {
                        if (remoteMeta && remoteMeta.version !== localMeta.version) {
                            setRemoteVersion(remoteMeta.version);
                            setUpdateAvailable(true);
                            setShowUpdateToast(true); // Trigger Notification
                        }
                    })
                    .catch(err => console.log("Gagal cek update:", err));
            }
        })
        .catch(err => console.error("Error loading metadata.json:", err));
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('luxury_cashflow_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        } else {
          setTransactions([]); // Default to empty
        }
      } catch (e) {
        setTransactions([]); // Default to empty
      }
    } else {
      setTransactions([]); // Default to empty (No initial dummy data)
    }
    setLoading(false);
  }, []);

  // Save to local storage whenever transactions change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('luxury_cashflow_data', JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  // Calculations (Global - Runs on ALL data to ensure running balance is correct)
  const calculatedData = useMemo(() => {
    let runningEstBalance = 0;
    let runningActBalance = 0;

    return transactions.map((t) => {
        const planIncome = Number(t.planIncome) || 0;
        const planExpense = Number(t.planExpense) || 0;
        const actIncome = Number(t.actIncome) || 0;
        const actExpense = Number(t.actExpense) || 0;

        // Running Estimated Balance
        runningEstBalance += planIncome - planExpense;

        // FORECAST LOGIC: 
        // If Actual is 0 (not inputted), use Plan value for the Running Actual Balance
        const effectiveIncome = actIncome !== 0 ? actIncome : planIncome;
        const effectiveExpense = actExpense !== 0 ? actExpense : planExpense;

        // Running Actual Balance (Forecasted)
        runningActBalance += effectiveIncome - effectiveExpense;
        
        // Difference between the Forecasted Actual Balance and Estimated Balance
        const diff = runningActBalance - runningEstBalance;

        return {
            ...t,
            estBalance: runningEstBalance,
            actBalance: runningActBalance,
            difference: diff
        } as CalculatedTransaction;
    });
  }, [transactions]);

  // Filter Logic (Runs on calculatedData)
  const filteredData = useMemo(() => {
    if (!dateFilter.start && !dateFilter.end) return calculatedData;

    return calculatedData.filter(item => {
        const itemDateVal = parseDateValue(item.date);
        let isValid = true;

        if (dateFilter.start) {
            // Parse YYYY-MM-DD input to Local Date 00:00:00 to match parseDateValue behavior
            const [y, m, d] = dateFilter.start.split('-').map(Number);
            const startVal = new Date(y, m - 1, d).getTime();
            if (itemDateVal < startVal) isValid = false;
        }

        if (dateFilter.end) {
            // Parse YYYY-MM-DD input to Local Date 00:00:00
            const [y, m, d] = dateFilter.end.split('-').map(Number);
            const endVal = new Date(y, m - 1, d).getTime();
            if (itemDateVal > endVal) isValid = false;
        }

        return isValid;
    });
  }, [calculatedData, dateFilter]);

  // Totals (Always based on GLOBAL calculated data, not filtered)
  const totals = useMemo(() => {
    const finalEstBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].estBalance : 0;
    const finalActBalance = calculatedData.length > 0 ? calculatedData[calculatedData.length - 1].actBalance : 0;
    return { finalEstBalance, finalActBalance };
  }, [calculatedData]);

  // --- Handlers ---

  const handleReset = () => {
    if (confirm("Hapus semua data transaksi? Tindakan ini tidak dapat dibatalkan.")) {
      setTransactions([]);
      localStorage.removeItem('luxury_cashflow_data');
    }
  };

  const handleUpdate = (id: number, field: keyof Transaction, value: string | number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  // Helper for real-time currency formatting in modal
  const handleCurrencyInput = (field: 'planIncome' | 'planExpense', value: string) => {
    // Strip non-numeric chars
    const numericStr = value.replace(/[^0-9]/g, '');
    
    if (!numericStr) {
        setNewTrans({ ...newTrans, [field]: '' });
        return;
    }
    
    // Convert to number and format back to IDR string
    const formatted = formatCurrency(Number(numericStr));
    setNewTrans({ ...newTrans, [field]: formatted });
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.date || !newTrans.description) {
        alert("Tanggal dan Keterangan wajib diisi!");
        return;
    }

    const displayDate = formatDateToDisplay(newTrans.date);
    // Temporary ID, will be re-indexed below
    const tempId = transactions.length + 1; 
    
    const newTransactionItem: Transaction = {
        id: tempId,
        date: displayDate,
        description: newTrans.description,
        planIncome: parseCurrency(newTrans.planIncome),
        planExpense: parseCurrency(newTrans.planExpense),
        actIncome: 0,
        actExpense: 0,
        isNew: true // Mark as new
    };

    // 1. Add new Item
    // 2. Sort by Date
    // 3. Re-Assign IDs sequentially (1, 2, 3...)
    setTransactions(prev => {
        const unsorted = [...prev, newTransactionItem];
        const sorted = unsorted.sort((a, b) => parseDateValue(a.date) - parseDateValue(b.date));
        
        return sorted.map((item, index) => ({
            ...item,
            id: index + 1
        }));
    });

    // Reset and Close
    setNewTrans({ date: '', description: '', planIncome: '', planExpense: '' });
    setIsModalOpen(false);
  };

  const handleJsonExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OhMonsea_Finance_Backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
            if(confirm(`Ditemukan ${json.length} baris data. Timpa data saat ini?`)) {
                // Re-index imported data just in case
                const reIndexed = json.map((item, index) => ({...item, id: index + 1}));
                setTransactions(reIndexed);
            }
        }
      } catch (err) {
        alert('Gagal membaca JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExcelExport = () => {
    // Export filtered data if filter is active, otherwise all
    exportToExcel(filteredData);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      if(confirm(`Berhasil membaca ${data.length} baris data Excel. Timpa data saat ini?`)) {
        // Re-index imported data
        const reIndexed = data.map((item, index) => ({...item, id: index + 1}));
        setTransactions(reIndexed);
      }
    } catch (err) {
      alert("Gagal Import Excel: " + err);
    }
    e.target.value = '';
  };

  const clearFilter = () => {
      setDateFilter({ start: '', end: '' });
      setIsFilterVisible(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50">Loading...</div>;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 z-20 shadow-sm shrink-0 transition-all duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                {/* Logo & Title */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-200">
                            <LayoutDashboard className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 font-serif tracking-tight">OhMonsea Finance Plan</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                                Perencanaan Arus Kas v{appVersion}
                            </p>
                        </div>
                    </div>
                    
                    {/* Mobile Toggle Filter */}
                    <button 
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        className={`xl:hidden p-2 rounded-md ${isFilterVisible || (dateFilter.start || dateFilter.end) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-4">
                    
                    {/* DATE FILTER SECTION */}
                    <div className={`${isFilterVisible || (dateFilter.start || dateFilter.end) ? 'flex' : 'hidden'} xl:flex flex-col md:flex-row items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 transition-all`}>
                         <div className="flex items-center gap-2">
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar className="w-3.5 h-3.5" />
                                </span>
                                <input 
                                    type="date" 
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter(prev => ({...prev, start: e.target.value}))}
                                    className="pl-7 pr-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-28 text-slate-600"
                                    placeholder="Start"
                                />
                            </div>
                            <span className="text-slate-400 text-[10px] font-bold">-</span>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar className="w-3.5 h-3.5" />
                                </span>
                                <input 
                                    type="date" 
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter(prev => ({...prev, end: e.target.value}))}
                                    className="pl-7 pr-2 py-1.5 text-[11px] font-medium border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-28 text-slate-600"
                                />
                            </div>
                         </div>
                         {(dateFilter.start || dateFilter.end) && (
                             <button onClick={clearFilter} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-colors" title="Reset Filter">
                                 <XCircle className="w-4 h-4" />
                             </button>
                         )}
                    </div>

                    {/* Stats Widget */}
                    <div className="hidden 2xl:flex items-center space-x-6 text-xs border-l border-slate-200 pl-6 h-8">
                        <div className="flex flex-col items-end">
                            <span className="text-slate-400 text-[10px] font-medium uppercase">Estimasi Saldo</span>
                            <span className="font-bold text-indigo-600 text-sm">{formatCurrency(totals.finalEstBalance)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-slate-400 text-[10px] font-medium uppercase">Saldo Aktual</span>
                            <span className={`font-bold text-sm ${totals.finalActBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(totals.finalActBalance)}
                            </span>
                        </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        
                        {/* Add Button */}
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            <span className="hidden sm:inline">Tambah</span>
                            <span className="sm:hidden">Add</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <input type="file" ref={fileExcelRef} accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} />
                        <input type="file" ref={fileJsonRef} accept=".json" className="hidden" onChange={handleJsonImport} />

                        {/* Import JSON Button */}
                        <button 
                            onClick={() => fileJsonRef.current?.click()}
                            className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-sm"
                            title="Import JSON"
                        >
                            <Upload className="w-3.5 h-3.5" />
                        </button>

                        {/* Save JSON */}
                        <button 
                            onClick={handleJsonExport} 
                            className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors shadow-sm"
                            title="Export JSON"
                        >
                            <Save className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Excel Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm shadow-emerald-200 transition-colors">
                                <Table className="w-3.5 h-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 hidden group-hover:block z-50">
                                <button onClick={() => fileExcelRef.current?.click()} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700">Import Excel</button>
                                <button onClick={handleExcelExport} className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700">Export Excel</button>
                            </div>
                        </div>

                         <button onClick={handleReset} className="p-2 text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-1" title="Hapus Semua Data">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Main Table */}
      <main className="flex-1 overflow-hidden w-full px-2 sm:px-4 lg:px-6 py-4 flex flex-col relative">
        <div className="bg-white rounded-lg shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-full relative z-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <table className="w-full text-xs border-collapse table-fixed">
                    <thead className="bg-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="w-[3%] p-2 text-center border-b border-r border-slate-200">ID</th>
                            <th className="w-[7%] p-2 text-left border-b border-r border-slate-200">Tanggal</th>
                            <th className="w-[20%] p-2 text-left border-b border-r border-slate-200">Keterangan</th>
                            
                            <th className="w-[10%] p-2 text-right border-b border-slate-200 bg-emerald-50/50 text-emerald-700">Rencana Masuk</th>
                            <th className="w-[10%] p-2 text-right border-b border-slate-200 bg-rose-50/50 text-rose-700">Rencana Keluar</th>
                            <th className="w-[10%] p-2 text-right border-b border-r border-slate-200 bg-slate-100 text-slate-700 font-bold">Est Saldo</th>
                            
                            <th className="w-[10%] p-2 text-right border-b border-slate-200 bg-emerald-100/30 text-emerald-800">Aktual Masuk</th>
                            <th className="w-[10%] p-2 text-right border-b border-slate-200 bg-rose-100/30 text-rose-800">Aktual Keluar</th>
                            <th className="w-[10%] p-2 text-right border-b border-r border-slate-200 bg-slate-100 text-slate-800 font-bold">Saldo Akt</th>
                            
                            <th className="w-[10%] p-2 text-right border-b border-slate-200">Selisih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-16 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center space-y-4 opacity-70">
                                        <div className="bg-slate-50 p-4 rounded-full border border-slate-100 shadow-sm">
                                            <FolderOpen className="w-10 h-10 text-indigo-200" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-slate-600">
                                                {transactions.length > 0 ? 'Tidak ada data pada tanggal ini' : 'Belum Ada Data Transaksi'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {transactions.length > 0 ? 'Coba ubah filter tanggal' : 'Mulai dengan menekan tombol Tambah Transaksi'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map(row => (
                                <tr key={row.id} className="group hover:bg-slate-50 transition-colors duration-150">
                                    {/* ID */}
                                    <td className="p-0 text-center text-slate-400 font-mono text-[10px] border-r border-slate-100">
                                        <div className="py-2 px-1">{row.id}</div>
                                    </td>

                                    {/* Tanggal */}
                                    <td className="p-0 border-r border-slate-100">
                                        <input 
                                            type="text" 
                                            value={row.date} 
                                            onChange={(e) => handleUpdate(row.id, 'date', e.target.value)}
                                            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
                                        />
                                    </td>

                                    {/* Keterangan */}
                                    <td className="p-0 border-r border-slate-100 relative">
                                        <div className="flex items-center h-full">
                                            <input 
                                                type="text" 
                                                value={row.description} 
                                                onChange={(e) => handleUpdate(row.id, 'description', e.target.value)}
                                                className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-slate-600"
                                            />
                                            {row.isNew && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded shadow-sm border border-blue-200 animate-pulse pointer-events-none">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Rencana Masuk */}
                                    <td className="p-0 border-slate-100 bg-emerald-50/10">
                                        <input 
                                            type="text"
                                            value={row.planIncome === 0 ? '' : formatCurrency(row.planIncome)}
                                            onChange={(e) => handleUpdate(row.id, 'planIncome', parseCurrency(e.target.value))}
                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-right font-mono tracking-tight ${row.planIncome > 0 ? 'text-emerald-600 font-medium' : 'text-slate-900'}`}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Rencana Keluar */}
                                    <td className="p-0 border-slate-100 bg-rose-50/10">
                                        <input 
                                            type="text"
                                            value={row.planExpense === 0 ? '' : formatCurrency(row.planExpense)}
                                            onChange={(e) => handleUpdate(row.id, 'planExpense', parseCurrency(e.target.value))}
                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 text-right font-mono tracking-tight ${row.planExpense > 0 ? 'text-rose-600 font-medium' : 'text-slate-900'}`}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Est Saldo */}
                                    <td className="p-0 border-r border-slate-100 bg-slate-50/50">
                                        <div className="flex items-center justify-end h-full px-2 py-1 font-bold text-slate-700 font-mono tracking-tight">
                                            {formatCurrency(row.estBalance)}
                                        </div>
                                    </td>

                                    {/* Aktual Masuk */}
                                    <td className="p-0 border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.actIncome === 0 && row.planIncome > 0 ? formatCurrency(row.planIncome) : (row.actIncome === 0 ? '' : formatCurrency(row.actIncome))}
                                            onChange={(e) => handleUpdate(row.id, 'actIncome', parseCurrency(e.target.value))}
                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-right font-mono tracking-tight 
                                                ${row.actIncome === 0 && row.planIncome > 0 ? 'text-emerald-400/60 italic font-medium' : ''}
                                                ${row.actIncome > 0 ? 'text-emerald-700 font-bold' : ''}
                                                ${row.actIncome === 0 && row.planIncome === 0 ? 'text-slate-900' : ''}
                                            `}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Aktual Keluar */}
                                    <td className="p-0 border-slate-100">
                                        <input 
                                            type="text"
                                            value={row.actExpense === 0 && row.planExpense > 0 ? formatCurrency(row.planExpense) : (row.actExpense === 0 ? '' : formatCurrency(row.actExpense))}
                                            onChange={(e) => handleUpdate(row.id, 'actExpense', parseCurrency(e.target.value))}
                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 text-right font-mono tracking-tight 
                                                ${row.actExpense === 0 && row.planExpense > 0 ? 'text-rose-400/60 italic font-medium' : ''}
                                                ${row.actExpense > 0 ? 'text-rose-700 font-bold' : ''}
                                                ${row.actExpense === 0 && row.planExpense === 0 ? 'text-slate-900' : ''}
                                            `}
                                            placeholder="0"
                                        />
                                    </td>

                                    {/* Saldo Aktual */}
                                    <td className="p-0 border-r border-slate-100 bg-slate-50/50">
                                        <div className={`flex items-center justify-end h-full px-2 py-1 font-bold font-mono tracking-tight ${row.actBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                            {formatCurrency(row.actBalance)}
                                        </div>
                                    </td>

                                    {/* Selisih */}
                                    <td className="p-0">
                                        <div className={`flex items-center justify-end h-full px-2 py-1 font-medium font-mono tracking-tight 
                                            ${row.difference > 0 ? 'text-emerald-600' : ''}
                                            ${row.difference < 0 ? 'text-red-500' : ''}
                                            ${row.difference === 0 ? 'text-slate-900' : ''}
                                        `}>
                                            <span>{row.difference > 0 ? '+' : ''}{formatCurrency(row.difference)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 shrink-0">
                <div className="flex items-center space-x-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span>Data tersimpan otomatis di browser</span>
                </div>
                <div>{filteredData.length} Baris ditampilkan (Total: {transactions.length})</div>
            </div>
        </div>
      </main>

      {/* --- NOTIFICATION TOAST --- */}
      {showUpdateToast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-4 toast-slide-in max-w-sm">
            <div className="p-2.5 bg-indigo-600 rounded-full shrink-0">
                <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">Update Tersedia!</h4>
                <p className="text-xs text-slate-400 mt-0.5">Versi <span className="text-white font-mono">{remoteVersion}</span> siap diinstall.</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
                <button 
                    onClick={() => {
                        setIsUpdateModalOpen(true);
                        setShowUpdateToast(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-900/50"
                >
                    Lihat
                </button>
                <button 
                    onClick={() => setShowUpdateToast(false)}
                    className="text-xs text-slate-500 hover:text-white transition-colors underline decoration-slate-600"
                >
                    Abaikan
                </button>
            </div>
        </div>
      )}

      {/* --- LUXURY ADD TRANSACTION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsModalOpen(false)}
            ></div>

            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden transform transition-all">
                <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-slate-800 font-serif font-bold text-2xl tracking-tight">Transaksi Baru</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium tracking-wide uppercase">Input Data Keuangan</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)} 
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-full hover:bg-rose-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleAddTransaction} className="p-8 space-y-6 bg-white">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Tanggal</label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="date" 
                                required
                                value={newTrans.date}
                                onChange={(e) => setNewTrans({...newTrans, date: e.target.value})}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Keterangan</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                required
                                placeholder="Contoh: Gaji Bulanan, Belanja Bulanan..."
                                value={newTrans.description}
                                onChange={(e) => setNewTrans({...newTrans, description: e.target.value})}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Rencana Masuk
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-sm">Rp</span>
                                <input 
                                    type="text" 
                                    placeholder="0"
                                    value={newTrans.planIncome}
                                    onChange={(e) => handleCurrencyInput('planIncome', e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-emerald-700 placeholder-emerald-300 text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-rose-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" /> Rencana Keluar
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold text-sm">Rp</span>
                                <input 
                                    type="text" 
                                    placeholder="0"
                                    value={newTrans.planExpense}
                                    onChange={(e) => handleCurrencyInput('planExpense', e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-rose-50/30 border border-rose-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-rose-100 focus:border-rose-500 outline-none transition-all text-sm font-bold text-rose-700 placeholder-rose-300 text-right"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3 border-t border-slate-50 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-[0.98]"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            className="flex-[2] px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Simpan Transaksi
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- UPDATE INSTRUCTION MODAL --- */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsUpdateModalOpen(false)}
            ></div>
            <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl p-6 modal-animate border border-white/50">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <Github className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Update Tersedia: v{remoteVersion}</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Browser tidak memiliki izin untuk mengubah file sistem Anda secara langsung. Silakan jalankan perintah berikut di terminal VS Code Anda:
                    </p>
                    
                    <div className="w-full bg-slate-900 rounded-lg p-4 relative group">
                        <code className="text-green-400 font-mono text-sm block text-center">node update.js</code>
                    </div>

                    <button 
                        onClick={() => setIsUpdateModalOpen(false)}
                        className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default App;