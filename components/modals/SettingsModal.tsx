import React, { useState } from 'react';
import { X, Settings, HardDrive, Trash2, Sparkles, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { VersionHistory } from '../../hooks/useAppConfig';

interface SettingsModalProps {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    resetData: () => void;
    appVersion: string;
    versionHistory: VersionHistory[];
}

export function SettingsModal({
    isSettingsOpen,
    setIsSettingsOpen,
    resetData,
    appVersion,
    versionHistory
}: SettingsModalProps) {
    const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

    if (!isSettingsOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-stone-500" />
                        Pengaturan
                    </h2>
                    <button onClick={() => setIsSettingsOpen(false)}>
                        <X className="w-5 h-5 text-stone-400 hover:text-stone-600 transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* What's New Section */}
                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 overflow-hidden">
                        <button
                            onClick={() => setIsWhatsNewOpen(!isWhatsNewOpen)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-bold text-indigo-900">Apa yang baru?</span>
                            </div>
                            {isWhatsNewOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                        </button>

                        {isWhatsNewOpen && (
                            <div className="px-4 pb-4 space-y-4 animate-fade-in divide-y divide-indigo-100">
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
                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                            <HardDrive className="w-3.5 h-3.5" />
                            Manajemen Data
                        </h3>
                        <button
                            onClick={() => { if (confirm("Yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.")) { resetData(); setIsSettingsOpen(false); } }}
                            className="w-full py-2.5 px-4 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset Semua Data
                        </button>
                        <p className="text-[10px] text-stone-400 text-center italic">
                            Semua data disimpan secara lokal di browser Anda.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-center shrink-0">
                    <p className="text-[10px] text-stone-400 font-medium">OhMonsea Finance v{appVersion} • Made with ❤️</p>
                </div>
            </div>
        </div>
    );
}
