import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import NativeDownload from '../src/plugins/NativeDownload';
import { Transaction, CalculatedTransaction } from '../types';

export const exportToExcel = async (data: CalculatedTransaction[]) => {
    const formattedData = data.map(item => ({
        'ID': item.id,
        'Tanggal': item.date,
        'Keterangan': item.description,
        'Kategori': item.category,
        'Rencana Masuk': item.planIncome,
        'Rencana Keluar': item.planExpense,
        'Estimasi Saldo': item.estBalance,
        'Aktual Masuk': item.actIncome,
        'Aktual Keluar': item.actExpense,
        'Saldo Aktual': item.actBalance,
        'Selisih': (item.actIncome === 0 && item.actExpense === 0) ? "No Data" : item.difference
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Set column widths
    const colWidths = [
        { wch: 5 }, { wch: 10 }, { wch: 30 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 18 },
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OhMonsea Plan");

    if (Capacitor.isNativePlatform()) {
        try {
            const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
            const fileName = `OhMonsea_Finance_Plan_${new Date().getTime()}.xlsx`;

            await NativeDownload.download({
                filename: fileName,
                base64Data: base64Data,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            alert('File Excel berhasil disimpan ke folder Download');
        } catch (err: any) {
            console.error("Export Excel Error:", err);
            alert('Debug Native Error: ' + (err.message || JSON.stringify(err)));
        }
    } else {
        XLSX.writeFile(workbook, "OhMonsea_Finance_Plan.xlsx");
    }
};

export const importFromExcel = (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, {
                    type: 'array',
                    cellDates: true, // Handle Excel serial dates automatically
                    dateNF: 'dd/mm/yyyy' // Preferred format
                });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }); // Get formatted strings

                if (jsonData.length === 0) {
                    reject("File Excel kosong atau format tidak dikenali.");
                    return;
                }

                // Map Excel columns back to application state keys with flexible header matching
                const getVal = (row: any, keys: string[]) => {
                    const foundKey = Object.keys(row).find(k =>
                        keys.some(search => k.toLowerCase().trim() === search.toLowerCase().trim())
                    );
                    return foundKey ? row[foundKey] : undefined;
                };

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const transactions: Transaction[] = jsonData.map((row: any) => ({
                    id: Number(getVal(row, ['ID', 'No'])) || 0,
                    date: String(getVal(row, ['Tanggal', 'Date', 'date']) || ''),
                    description: String(getVal(row, ['Keterangan', 'Description', 'description']) || ''),
                    category: String(getVal(row, ['Kategori', 'Category', 'category']) || 'Lainnya') as any,
                    planIncome: Number(getVal(row, ['Rencana Masuk', 'Plan Income', 'income_plan'])) || 0,
                    planExpense: Number(getVal(row, ['Rencana Keluar', 'Plan Expense', 'expense_plan'])) || 0,
                    actIncome: Number(getVal(row, ['Aktual Masuk', 'Actual Income', 'income_actual'])) || 0,
                    actExpense: Number(getVal(row, ['Aktual Keluar', 'Actual Expense', 'expense_actual'])) || 0,
                }));

                resolve(transactions);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);

        // Use readAsArrayBuffer for better compatibility with binary Excel files
        reader.readAsArrayBuffer(file);
    });
};