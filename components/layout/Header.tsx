import React from 'react';
import {
    LayoutList, BarChart3, CalendarDays, Target, Info,
    Search, Sparkles, FileDown, Save, Settings2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ViewMode } from '../../hooks/useAppConfig';
import { HelpButton } from '../ui/HelpButton';

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

const navItems = [
    {
        key: 'table' as ViewMode,
        label: 'Data',
        Icon: LayoutList,
        activeClass: 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100',
        iconClass: 'text-blue-500',
    },
    {
        key: 'analytics' as ViewMode,
        label: 'Analitik',
        Icon: BarChart3,
        activeClass: 'bg-violet-50 text-violet-600 shadow-sm shadow-violet-100',
        iconClass: 'text-violet-500',
    },
    {
        key: 'calendar' as ViewMode,
        label: 'Kalender',
        Icon: CalendarDays,
        activeClass: 'bg-amber-50 text-amber-600 shadow-sm shadow-amber-100',
        iconClass: 'text-amber-500',
    },
    {
        key: 'budget' as ViewMode,
        label: 'Anggaran',
        Icon: Target,
        activeClass: 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100',
        iconClass: 'text-emerald-500',
    },
    {
        key: 'about' as ViewMode,
        label: 'Tentang',
        Icon: Info,
        activeClass: 'bg-stone-100 text-stone-700 shadow-sm',
        iconClass: 'text-stone-500',
    },
];

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
    return (
        <header className="bg-white border-b border-stone-200 z-20 shadow-sm shrink-0 transition-all duration-300">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">

                    {/* Logo & Title */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="OhMonsea Logo"
                                className="h-12 w-auto object-contain"
                            />
                            <div className="w-px h-8 bg-stone-200 mx-1" />
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: '#1b2a4a' }}>
                                    Self Finance
                                </p>
                                <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: '#4a6080' }}>
                                    v{appVersion}
                                </p>
                            </div>
                        </div>

                        {/* View Switcher (Desktop) */}
                        <div className="hidden md:flex bg-stone-100 p-1 rounded-xl ml-4 gap-0.5">
                            {navItems.map(({ key, label, Icon, activeClass, iconClass }) => (
                                <button
                                    key={key}
                                    onClick={() => setViewMode(key)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 select-none',
                                        viewMode === key
                                            ? activeClass
                                            : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/60'
                                    )}
                                >
                                    <Icon className={cn('w-3.5 h-3.5 transition-colors', viewMode === key ? iconClass : '')} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Global Search */}
                        <div className="relative w-full md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                id="global-search"
                                type="text"
                                placeholder="Cari transaksi... (Ctrl+K)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-xs focus:ring-2 focus:ring-blue-300 focus:border-blue-300 outline-none text-stone-700 placeholder-stone-400 transition-all"
                            />
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center gap-2 self-end md:self-auto ml-auto">
                            {/* Tambah */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-gradient-to-br from-stone-800 to-stone-900 text-white shadow-md shadow-stone-300 hover:shadow-lg hover:from-stone-700 hover:to-stone-800 active:scale-95 transition-all"
                                title="Tambah Transaksi"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span className="hidden sm:inline">Tambah</span>
                            </button>

                            {/* PDF Export */}
                            <div className="hidden lg:flex items-center gap-1">
                                <button
                                    onClick={onExportPDF}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 rounded-lg shadow-sm transition-all active:scale-95"
                                    title="Ekspor PDF"
                                >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                </button>
                                <HelpButton
                                    title="Ekspor PDF"
                                    tips={[
                                        { title: 'Apa itu Ekspor PDF?', desc: 'Menghasilkan laporan keuangan dalam format PDF siap cetak.' },
                                        { title: 'Isi laporan', desc: 'Mencakup semua transaksi yang terlihat sesuai filter aktif.' },
                                        { title: 'Tips', desc: 'Gunakan filter tanggal/kategori terlebih dahulu untuk laporan spesifik.' },
                                    ]}
                                />
                            </div>

                            {/* File Manager */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { setShowFileManager(true); setActiveTab('open'); }}
                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 rounded-lg shadow-sm transition-all active:scale-95"
                                    title="Simpan Data"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Simpan</span>
                                </button>
                                <HelpButton
                                    title="File Manager"
                                    tips={[
                                        { title: 'Simpan Data', desc: 'Ekspor semua transaksi ke file JSON untuk backup lokal.' },
                                        { title: 'Buka / Impor', desc: 'Impor data dari file JSON yang sebelumnya disimpan.' },
                                        { title: 'Privasi', desc: 'Semua data tersimpan di perangkat Anda, tidak dikirim ke server.' },
                                        { title: 'Format', desc: 'File berformat .json, dapat dibuka ulang di aplikasi ini kapan saja.' },
                                    ]}
                                />
                            </div>

                            {/* Settings */}
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-2 text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 rounded-lg transition-all active:scale-95 hover:rotate-45"
                                title="Pengaturan"
                            >
                                <Settings2 className="w-4 h-4 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
