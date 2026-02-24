import React from 'react';
import { X, FolderOpen, FileJson, Table, HardDrive, Download } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Transaction } from '../../types';

interface FileManagerModalProps {
    showFileManager: boolean;
    setShowFileManager: (show: boolean) => void;
    activeTab: 'save' | 'open';
    setActiveTab: (tab: 'save' | 'open') => void;
    savedFiles: any[];
    setTransactions: (data: Transaction[]) => void;
    fileJsonRef: React.RefObject<HTMLInputElement>;
    fileExcelRef: React.RefObject<HTMLInputElement>;
    handleExcelImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveToDisk: () => void;
    fileNameInput: string;
    setFileNameInput: (name: string) => void;
    handleSaveInternal: () => void;
    handleJsonExport: () => void;
    exportToExcel: (data: any[]) => void;
    filteredData: any[];
    appVersion: string;
    onExportPDF: () => void;
}

export function FileManagerModal({
    showFileManager,
    setShowFileManager,
    activeTab,
    setActiveTab,
    savedFiles,
    setTransactions,
    fileJsonRef,
    fileExcelRef,
    handleExcelImport,
    handleSaveToDisk,
    fileNameInput,
    setFileNameInput,
    handleSaveInternal,
    handleJsonExport,
    exportToExcel,
    filteredData,
    appVersion,
    onExportPDF
}: FileManagerModalProps) {
    if (!showFileManager) return null;

    const btnPrimaryClass = "text-white shadow-lg transition-all active:scale-[0.98] font-bold bg-stone-800 hover:bg-stone-900 shadow-stone-200";

    return (
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
                                    if (e.target.files?.[0]) {
                                        const r = new FileReader();
                                        r.onload = (ev) => { try { setTransactions(JSON.parse(ev.target?.result as string)); setShowFileManager(false); } catch (err) { alert("Invalid JSON") } };
                                        r.readAsText(e.target.files[0]);
                                    }
                                }} />
                                <input type="file" ref={fileExcelRef} accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => fileJsonRef.current?.click()} className="p-3 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-50"><FileJson className="w-4 h-4" /> Import JSON</button>
                                    <button onClick={() => fileExcelRef.current?.click()} className="p-3 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 flex items-center justify-center gap-2 hover:bg-stone-50"><Table className="w-4 h-4 text-emerald-500" /> Import Excel</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Native FS API Save */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2"><HardDrive className="w-4 h-4" /> Simpan ke Perangkat (Google Drive)</h3>
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
                                <button onClick={handleJsonExport} className="flex items-center justify-center gap-2 p-3 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100"><Download className="w-4 h-4" /> Download JSON</button>
                                <button onClick={() => exportToExcel(filteredData)} className="flex items-center justify-center gap-2 p-3 border border-stone-200 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50"><Table className="w-4 h-4" /> Download Excel</button>
                            </div>
                            <button
                                onClick={onExportPDF}
                                className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 transition-colors"
                            >
                                <FileJson className="w-4 h-4 text-rose-500" /> Ekspor Laporan PDF (Profesional)
                            </button>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-between items-center text-xs text-stone-400">
                    <span>OhMonsea Finance v{appVersion}</span>
                </div>
            </div>
        </div>
    );
}
