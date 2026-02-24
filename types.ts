export type TransactionCategory = 'Pemasukan' | 'Kebutuhan Pokok' | 'Tagihan' | 'Hiburan' | 'Tabungan' | 'Cicilan' | 'Lainnya';

export interface Transaction {
    id: number;
    date: string;
    description: string;
    category: TransactionCategory; // New Field
    planIncome: number;
    planExpense: number;
    actIncome: number;
    actExpense: number;
    isNew?: boolean;
}

export interface CalculatedTransaction extends Transaction {
    estBalance: number;
    actBalance: number;
    difference: number;
}

export interface CategoryBudget {
    category: string;
    limit: number;
    monthYear: string; // Format: "MM-YYYY" or "Month YYYY"
}