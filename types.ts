export interface Transaction {
    id: number;
    date: string;
    description: string;
    planIncome: number;
    planExpense: number;
    actIncome: number;
    actExpense: number;
    isNew?: boolean; // Flag to mark newly added rows
}

export interface CalculatedTransaction extends Transaction {
    estBalance: number;
    actBalance: number;
    difference: number;
}
