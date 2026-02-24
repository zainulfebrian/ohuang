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

const monthMap: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Mei': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Agu': 7, 'Sep': 8, 'Oct': 9, 'Okt': 9, 'Nov': 10, 'Dec': 11, 'Des': 11
};

export const parseDateValue = (dateVal: any): number => {
    if (!dateVal) return 9999999999;

    // If it's already a Date object
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
        return dateVal.getTime();
    }

    // Convert to string and clean
    let dateStr = String(dateVal).trim();
    if (!dateStr || dateStr.toLowerCase() === 'null' || dateStr.toLowerCase() === 'undefined') return 9999999999;

    try {
        // Handle native Excel date numbers (serials)
        if (/^\d{5}$/.test(dateStr)) {
            const excelDate = Number(dateStr);
            return new Date((excelDate - 25569) * 86400 * 1000).getTime();
        }

        // Handle DD/MM/YYYY
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const y = parts.length === 3 ? parseInt(parts[2], 10) : new Date().getFullYear();
            // Ensure year is 4 digits
            const fullYear = y < 100 ? 2000 + y : y;
            return new Date(fullYear, m - 1, d).getTime();
        }

        // Handle ISO or standard formatsY YYYY-MM-DD
        const nativeDate = new Date(dateStr);
        if (!isNaN(nativeDate.getTime())) {
            return nativeDate.getTime();
        }

        // Handle legacy DD-MMM-YY or DD-MMM-YYYY
        const parts = dateStr.split('-');
        if (parts.length < 2) return 9999999999;

        const day = parseInt(parts[0], 10);
        const monthIndex = monthMap[parts[1]] ?? 0;
        let yearPart = parts.length === 3 ? parseInt(parts[2], 10) : 2026;
        let year = yearPart < 100 ? 2000 + yearPart : yearPart;

        return new Date(year, monthIndex, day).getTime();
    } catch (e) {
        return 9999999999;
    }
};

export const formatDateToDisplay = (isoDate: string): string => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
};

export const reverseDateForInput = (displayDate: string): string => {
    if (!displayDate || !displayDate.includes('/')) return new Date().toISOString().split('T')[0];
    const [d, m, y] = displayDate.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
