import * as XLSX from 'xlsx';
import { Transaction, CalculatedTransaction } from '../types';

export const exportToExcel = (data: CalculatedTransaction[]) => {
    const formattedData = data.map(item => ({
        'ID': item.id,
        'Tanggal': item.date,
        'Keterangan': item.description,
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
        { wch: 5 }, { wch: 10 }, { wch: 40 }, 
        { wch: 15 }, { wch: 15 }, { wch: 18 }, 
        { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "OhMonsea Plan");
    XLSX.writeFile(workbook, "OhMonsea_Finance_Plan.xlsx");
};

export const importFromExcel = (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    reject("File Excel kosong atau format tidak dikenali.");
                    return;
                }

                // Map Excel columns back to application state keys
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const transactions: Transaction[] = jsonData.map((row: any) => ({
                    id: Number(row['ID']) || 0,
                    date: String(row['Tanggal'] || ''),
                    description: String(row['Keterangan'] || ''),
                    planIncome: Number(row['Rencana Masuk']) || 0,
                    planExpense: Number(row['Rencana Keluar']) || 0,
                    actIncome: Number(row['Aktual Masuk']) || 0,
                    actExpense: Number(row['Aktual Keluar']) || 0,
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