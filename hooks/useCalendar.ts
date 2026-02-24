import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { parseDateValue, formatDateToDisplay } from '../utils/formatters';

export function useCalendar(transactions: Transaction[]) {
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarGrid = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const startingSlot = firstDay;
        const days = [];
        for (let i = 0; i < startingSlot; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [calendarDate]);

    const getTransactionsForDate = (date: Date) => {
        return transactions.filter(t => {
            const tDate = new Date(parseDateValue(t.date));
            return tDate.getDate() === date.getDate() &&
                tDate.getMonth() === date.getMonth() &&
                tDate.getFullYear() === date.getFullYear();
        });
    };

    const handlePrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    return {
        calendarDate, setCalendarDate,
        selectedDate, setSelectedDate,
        calendarGrid,
        getTransactionsForDate,
        handlePrevMonth,
        handleNextMonth,
        monthNames
    };
}
