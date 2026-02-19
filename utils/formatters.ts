export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const parseCurrency = (value: string): number => {
    return Number(value.replace(/[^0-9]/g, ''));
};

// Helper for Month parsing (Indonesian/English generic)
const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Mei': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Agu': 7, 'Sep': 8, 'Oct': 9, 'Okt': 9, 'Nov': 10, 'Dec': 11, 'Des': 11
};

export const parseDateValue = (dateStr: string): number => {
    // Expected format: "DD-MMM" (e.g., "10-Feb") OR "DD-MMM-YY" (e.g., "10-Feb-26")
    try {
        const parts = dateStr.split('-');
        if (parts.length < 2) return 9999999999;
        
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1];
        const monthIndex = monthMap[monthStr] ?? 0;
        
        // Handle Year
        let year = 2026; // Default
        if (parts.length === 3) {
            const shortYear = parseInt(parts[2], 10);
            year = 2000 + shortYear;
        }
        
        const date = new Date(year, monthIndex, day);
        return date.getTime();
    } catch (e) {
        return 9999999999;
    }
};

// Convert YYYY-MM-DD (Input Date) to DD-MMM-YY
export const formatDateToDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
    const year = String(date.getFullYear()).slice(-2); // Take last 2 digits
    return `${day}-${months[date.getMonth()]}-${year}`;
};
