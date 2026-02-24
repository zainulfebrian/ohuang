import React, { useState } from 'react';
import {
    X, Settings, HardDrive, Trash2, Sparkles, ChevronDown, ChevronUp,
    CheckCircle2, Tag, Plus, Lock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { VersionHistory } from '../../hooks/useAppConfig';
import { useCategories, COLOR_PRESETS } from '../../hooks/useCategories';
import { CATEGORIES } from '../../constants';

interface SettingsModalProps {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    resetData: () => void;
    appVersion: string;
    versionHistory: VersionHistory[];
}

type Tab = 'general' | 'kategori';

export function SettingsModal({ isSettingsOpen, setIsSettingsOpen, resetData, appVersion, versionHistory }: SettingsModalProps) {
    const [tab, setTab] = useState<Tab>('general');
    const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

    // Category management
    const { allCategories, customCategories, addCategory, removeCategory } = useCategories();
    const [newCatName, setNewCatName] = useState('');
    const [newCatColorIdx, setNewCatColorIdx] = useState(0);
    const [catError, setCatError] = useState('');
    const [catSuccess, setCatSuccess] = useState('');

    if (!isSettingsOpen) return null;

    const handleAddCategory = () => {
        if (!newCatName.trim()) { setCatError('Nama kategori wajib diisi.'); return; }
        const ok = addCategory(newCatName.trim(), COLOR_PRESETS[newCatColorIdx].tailwind);
        if (!ok) { setCatError('Kategori sudah ada.'); setCatSuccess(''); return; }
        setCatError('');
        setCatSuccess(`Kategori "${newCatName.trim()}" berhasil ditambahkan!`);
        setNewCatName('');
        setTimeout(() => setCatSuccess(''), 2500);
    };

    const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'general', label: 'Umum', icon: <Settings className="w-3.5 h-3.5" /> },
        { id: 'kategori', label: 'Kategori', icon: <Tag className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-stone-500" />Pengaturan
                    </h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg hover:bg-stone-200/60 transition-colors">
                        <X className="w-5 h-5 text-stone-400 hover:text-stone-600 transition-colors" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-200 bg-stone-50 px-4 gap-1 shrink-0">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={cn('flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold border-b-2 transition-colors',
                                tab === t.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            )}>
                            {t.icon}{t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1">

                    {/* ── Tab: Umum ─────────────────────────────────────────── */}
                    {tab === 'general' && (
                        <div className="p-5 space-y-5">
                            {/* What's New */}
                            <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
                                <button onClick={() => setIsWhatsNewOpen(!isWhatsNewOpen)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-indigo-900">Apa yang baru?</span>
                                    </div>
                                    {isWhatsNewOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                                </button>
                                {isWhatsNewOpen && (
                                    <div className="px-4 pb-4 space-y-3 animate-fade-in divide-y divide-indigo-100">
                                        {versionHistory.map((item, i) => (
                                            <div key={i} className="pt-3 first:pt-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100 italic">v{item.version}</span>
                                                    <span className="text-[9px] text-indigo-400 font-medium">{item.date}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">{item.changes}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Data Management */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                    <HardDrive className="w-3.5 h-3.5" />Manajemen Data
                                </h3>
                                <button
                                    onClick={() => { if (confirm('Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) { resetData(); setIsSettingsOpen(false); } }}
                                    className="w-full py-2.5 px-4 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <Trash2 className="w-4 h-4" />Reset Semua Data
                                </button>
                                <p className="text-[10px] text-stone-400 text-center italic">Semua data disimpan secara lokal di browser Anda.</p>
                            </div>
                        </div>
                    )}

                    {/* ── Tab: Kategori ─────────────────────────────────────── */}
                    {tab === 'kategori' && (
                        <div className="p-5 space-y-4">

                            {/* Add form */}
                            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" />Tambah Kategori Baru
                                </h3>
                                <input
                                    value={newCatName}
                                    onChange={e => { setNewCatName(e.target.value); setCatError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                    placeholder="Nama kategori..."
                                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                />

                                {/* Color picker */}
                                <div>
                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">Pilih Warna</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLOR_PRESETS.map((c, i) => (
                                            <button key={i} onClick={() => setNewCatColorIdx(i)} title={c.label}
                                                className={cn('w-6 h-6 rounded-full border-2 transition-all',
                                                    newCatColorIdx === i ? 'border-indigo-500 scale-110' : 'border-transparent')}
                                                style={{ background: c.hex }} />
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-stone-400 mt-1">
                                        Dipilih: <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', COLOR_PRESETS[newCatColorIdx].tailwind)}>{newCatName || 'Kategori'}</span>
                                    </p>
                                </div>

                                {catError && <p className="text-[10px] text-rose-500 font-medium">{catError}</p>}
                                {catSuccess && <p className="text-[10px] text-emerald-600 font-medium">{catSuccess}</p>}

                                <button onClick={handleAddCategory}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]">
                                    <Plus className="w-3.5 h-3.5" />Tambah Kategori
                                </button>
                            </div>

                            {/* Existing list */}
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Semua Kategori ({allCategories.length})</h3>
                                {allCategories.map((cat, i) => {
                                    const isBuiltIn = !!CATEGORIES.find(c => c.name === cat.name);
                                    return (
                                        <div key={i} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-stone-200">
                                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded flex-1', cat.color)}>{cat.name}</span>
                                            {isBuiltIn ? (
                                                <div className="flex items-center gap-1 text-[9px] text-stone-400 shrink-0">
                                                    <Lock className="w-3 h-3" />
                                                    <span>Bawaan</span>
                                                </div>
                                            ) : (
                                                <button onClick={() => { if (confirm(`Hapus kategori "${cat.name}"?`)) removeCategory(cat.name); }}
                                                    className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-center shrink-0">
                    <p className="text-[10px] text-stone-400 font-medium">OhMonsea Finance v{appVersion} • Made with ❤️</p>
                </div>
            </div>
        </div>
    );
}
