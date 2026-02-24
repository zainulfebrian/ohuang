import React, { useState, useEffect } from 'react';
import { Transaction, CalculatedTransaction } from '../types';
import { exportToExcel, importFromExcel } from '../utils/excel';

interface SavedFile {
    id: number;
    name: string;
    date: string;
    itemCount: number;
    data: Transaction[];
}

export function useFileManager(
    transactions: Transaction[],
    setTransactions: (t: Transaction[]) => void,
    calculatedData: CalculatedTransaction[]
) {
    const [showFileManager, setShowFileManager] = useState(false);
    const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
    const [fileNameInput, setFileNameInput] = useState('');
    const [activeTab, setActiveTab] = useState<'save' | 'open'>('open');
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

    // Load saved files from localStorage
    useEffect(() => {
        const files = localStorage.getItem('ohmonsea_saved_files');
        if (files) {
            try { setSavedFiles(JSON.parse(files)); } catch (e) { setSavedFiles([]); }
        }
    }, []);

    // Save saved files to localStorage
    useEffect(() => {
        localStorage.setItem('ohmonsea_saved_files', JSON.stringify(savedFiles));
    }, [savedFiles]);

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
                suggestedName: `OhMonsea_Plan_${new Date().toISOString().slice(0, 10)}.json`,
                types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
            });
            setFileHandle(handle);
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(transactions, null, 2));
            await writable.close();
            setShowFileManager(false);
            alert("File berhasil disimpan! Anda sekarang bisa menekan Ctrl+S untuk menyimpan perubahan langsung ke file ini.");
        } catch (err) {
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
        setFileNameInput('');
        setActiveTab('open');
    };

    const handleJsonExport = () => {
        const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OhMonsea_Backup.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const data = await importFromExcel(e.target.files[0]);
            if (confirm(`Load ${data.length} baris?`)) {
                setTransactions(data.map((item, i) => ({
                    ...item,
                    id: i + 1
                })));
            }
        }
    };

    const handleTableExport = () => exportToExcel(calculatedData);

    return {
        showFileManager, setShowFileManager,
        savedFiles, setSavedFiles,
        fileNameInput, setFileNameInput,
        activeTab, setActiveTab,
        fileHandle,
        handleQuickSave,
        handleSaveToDisk,
        handleSaveInternal,
        handleJsonExport,
        handleExcelImport,
        handleTableExport
    };
}
