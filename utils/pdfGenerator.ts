import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import NativeDownload from '../src/plugins/NativeDownload';
import { CalculatedTransaction } from '../types';
import { formatCurrency } from './formatters';

interface ExportData {
    transactions: CalculatedTransaction[];
    totals: {
        finalEstBalance: number;
        finalActBalance: number;
        periodIncome: number;
        periodExpense: number;
    };
    appVersion: string;
    title?: string;
}

export const generateFinancePDF = async (data: ExportData) => {
    const { transactions, totals, appVersion, title } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // --- Header ---
    doc.setFillColor(31, 41, 55); // Dark Stone-800
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('OhMonsea Self-Finance', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title || `Laporan Keuangan Personal - v${appVersion}`, 15, 28);
    doc.text(`Dicetak pada: ${dateStr}`, pageWidth - 15, 28, { align: 'right' });

    // --- Summary Section ---
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Keuangan', 15, 55);

    const summaryTableData = [
        ['Total Pemasukan (Periode)', formatCurrency(totals.periodIncome)],
        ['Total Pengeluaran (Periode)', formatCurrency(totals.periodExpense)],
        ['Tabungan Netto (Periode)', formatCurrency(totals.periodIncome - totals.periodExpense)],
        ['Saldo Akhir Aktual', formatCurrency(totals.finalActBalance)],
    ];

    autoTable(doc, {
        startY: 60,
        head: [['Keterangan', 'Nilai']],
        body: summaryTableData,
        theme: 'striped',
        headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // --- Transactions Table ---
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.text('Detail Transaksi', 15, finalY + 15);

    const tableHeaders = [['Tgl', 'Keterangan', 'Kategori', 'Renc Masuk', 'Renc Keluar', 'Akt Masuk', 'Akt Keluar']];
    const tableBody = transactions.map(t => [
        t.date,
        t.description,
        t.category,
        formatCurrency(t.planIncome),
        formatCurrency(t.planExpense),
        formatCurrency(t.actIncome),
        formatCurrency(t.actExpense)
    ]);

    autoTable(doc, {
        startY: finalY + 20,
        head: tableHeaders,
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [55, 65, 81], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    // --- Footer ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    if (Capacitor.isNativePlatform()) {
        try {
            const dataUri = doc.output('datauristring');
            const base64Data = dataUri.split(',')[1];
            const fileName = `OhMonsea_Finance_Report_${new Date().getTime()}.pdf`;

            await NativeDownload.download({
                filename: fileName,
                base64Data: base64Data,
                mimeType: 'application/pdf'
            });
            alert('File PDF berhasil disimpan ke folder Download');
        } catch (err) {
            console.error("Export PDF Error:", err);
            alert('Gagal mengekspor Laporan PDF di perangkat.');
        }
    } else {
        doc.save(`OhMonsea_Finance_Report_${new Date().getTime()}.pdf`);
    }
};
