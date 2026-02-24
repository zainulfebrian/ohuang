import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import NativeDownload from '../src/plugins/NativeDownload';
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
    calculatedData: CalculatedTransaction[],
    showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void = () => { },
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
            showToast('Perubahan tersimpan ke file lokal ✓', 'success');
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan otomatis. Izin mungkin dicabut.', 'error');
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
            showToast('File berhasil disimpan! Tekan Ctrl+S untuk update langsung.', 'success');
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                handleJsonExport(); // Fallback
            }
        }
    };

    const handleSaveInternal = () => {
        if (!fileNameInput.trim()) { showToast('Masukkan nama file terlebih dahulu!', 'warning'); return; }
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

    const handleJsonExport = async () => {
        const jsonContent = JSON.stringify(transactions, null, 2);

        if (Capacitor.isNativePlatform()) {
            try {
                const fileName = `OhMonsea_Backup_${new Date().getTime()}.json`;
                // Convert utf-8 string to base64
                const base64Data = btoa(unescape(encodeURIComponent(jsonContent)));

                await NativeDownload.download({
                    filename: fileName,
                    base64Data: base64Data,
                    mimeType: 'application/json'
                });
                showToast('File JSON berhasil disimpan ke folder Download', 'success');
            } catch (err) {
                console.error("Export JSON Error:", err);
                showToast('Gagal mengekspor file di perangkat.', 'error');
            }
            return;
        }

        const blob = new Blob([jsonContent], { type: 'application/json' });
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
