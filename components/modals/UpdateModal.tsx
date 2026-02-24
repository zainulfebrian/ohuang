import React from 'react';
import { X, FileText, HardDrive, Github } from 'lucide-react';

interface UpdateModalProps {
    isUpdateModalOpen: boolean;
    setIsUpdateModalOpen: (open: boolean) => void;
    appVersion: string;
    remoteVersion: string;
    remoteChangelog: string;
    githubInfo: { username: string; repo: string };
}

export function UpdateModal({
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    appVersion,
    remoteVersion,
    remoteChangelog,
    githubInfo
}: UpdateModalProps) {
    if (!isUpdateModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsUpdateModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-stone-900 px-6 py-5 border-b border-stone-700 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/30">New Update</span>
                            <span className="text-stone-400 text-xs">v{appVersion} → v{remoteVersion}</span>
                        </div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">Versi Baru Tersedia!</h2>
                    </div>
                    <button onClick={() => setIsUpdateModalOpen(false)} className="p-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="prose prose-sm prose-stone max-w-none">
                        <h3 className="text-stone-800 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Apa yang baru?</h3>
                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                            {remoteChangelog}
                        </div>
                    </div>

                    <div className="mt-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                        <HardDrive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-amber-800">Cara Update Manual</h4>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                Jalankan perintah berikut di terminal folder aplikasi Anda untuk mengunduh pembaruan:
                            </p>
                            <div className="mt-2 bg-white border border-amber-200 p-2 rounded-lg font-mono text-xs text-stone-600 select-all cursor-pointer hover:bg-amber-50 transition-colors group relative" onClick={() => { navigator.clipboard.writeText('node update.js'); }}>
                                node update.js
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to copy</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
                    <button onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">Tutup</button>
                    <button onClick={() => { window.open(`https://github.com/${githubInfo.username}/${githubInfo.repo}`, '_blank'); }} className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-lg hover:bg-stone-800 shadow-lg shadow-stone-200 transition-all flex items-center gap-2">
                        <Github className="w-4 h-4" /> Buka GitHub
                    </button>
                </div>
            </div>
        </div>
    );
}
