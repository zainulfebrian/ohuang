import React from 'react';
import { LayoutDashboard, List, PieChart as PieIcon, Calendar, Search, Plus, FolderOpen, Settings, Target, FileJson, Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ViewMode } from '../../hooks/useAppConfig';

interface HeaderProps {
    appVersion: string;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setIsModalOpen: (open: boolean) => void;
    setShowFileManager: (open: boolean) => void;
    setActiveTab: (tab: 'save' | 'open') => void;
    setIsSettingsOpen: (open: boolean) => void;
    onExportPDF: () => void;
}

export function Header({
    appVersion,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    setIsModalOpen,
    setShowFileManager,
    setActiveTab,
    setIsSettingsOpen,
    onExportPDF
}: HeaderProps) {
    const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";
    const textPrimaryClass = "text-stone-700";

    return (
        <header className="bg-white border-b border-stone-200 z-20 shadow-sm shrink-0 transition-all duration-300">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                    {/* Logo & Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center gap-3 group">
                                <div className={cn("p-2 rounded-xl shadow-lg transition-all", btnPrimaryClass)}>
                                    <Wallet className="text-white w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-base font-black text-stone-900 font-serif tracking-tight leading-none">
                                        <span>Oh</span><span className="text-indigo-600">Monsea</span>
                                        <span className="font-light text-stone-500"> Self-Finance</span>
                                    </h1>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-[0.15em] font-bold">
                                        v{appVersion}
                                    </p>
                                </div>
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
                            <button onClick={() => setViewMode('budget')} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2", viewMode === 'budget' ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700")}>
                                <Target className="w-3.5 h-3.5" /> Anggaran
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
                                placeholder="Cari transaksi, ketegori, atau tanggal (DD/MM/YYYY)... (Ctrl+K)"
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
                                onClick={onExportPDF}
                                className="hidden lg:flex items-center px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-md shadow-sm transition-colors"
                                title="Ekspor PDF"
                            >
                                <FileJson className="w-3.5 h-3.5 mr-1.5" />
                                <span>PDF</span>
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
    );
}
