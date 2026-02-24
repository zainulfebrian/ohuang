import React from 'react';
import { Calendar, ArrowUp, ArrowDown, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../constants';
import { Transaction } from '../../types';

interface CalendarViewProps {
    calendarDate: Date;
    setCalendarDate: (date: Date) => void;
    calendarGrid: (Date | null)[];
    getTransactionsForDate: (date: Date) => Transaction[];
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    monthNames: string[];
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
}

export function CalendarView({
    calendarDate,
    setCalendarDate,
    calendarGrid,
    getTransactionsForDate,
    handlePrevMonth,
    handleNextMonth,
    monthNames,
    selectedDate,
    setSelectedDate
}: CalendarViewProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 h-full flex flex-col overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-stone-500" />
                    {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h2>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"><ArrowUp className="w-4 h-4 -rotate-90" /></button>
                    <button onClick={() => setCalendarDate(new Date())} className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold hover:bg-stone-100 transition-colors">Hari Ini</button>
                    <button onClick={handleNextMonth} className="p-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"><ArrowDown className="w-4 h-4 -rotate-90" /></button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-7 gap-px bg-stone-200 border border-stone-200 rounded-lg overflow-hidden">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                        <div key={day} className="bg-stone-100 p-2 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}

                    {calendarGrid.map((date, i) => {
                        if (!date) return <div key={`empty-${i}`} className="bg-stone-50/50 min-h-[100px]" />;

                        const dayTrans = getTransactionsForDate(date);
                        const dayIncome = dayTrans.reduce((sum, t) => sum + (t.actIncome || t.planIncome || 0), 0);
                        const dayExpense = dayTrans.reduce((sum, t) => sum + (t.actExpense || t.planExpense || 0), 0);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedDate(date.toISOString())}
                                className={cn(
                                    "bg-white p-2 min-h-[100px] hover:bg-stone-50 transition-colors cursor-pointer flex flex-col justify-between group relative",
                                    isToday && "bg-indigo-50/30 ring-1 ring-inset ring-indigo-200"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                                        isToday ? "bg-indigo-600 text-white" : "text-stone-400 group-hover:text-stone-600"
                                    )}>
                                        {date.getDate()}
                                    </span>
                                    {dayTrans.length > 0 && (
                                        <span className="text-[9px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
                                            {dayTrans.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 mt-2">
                                    {dayIncome > 0 && (
                                        <div className="flex items-center justify-between text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                            <span className="font-bold">Masuk</span>
                                            <span>{formatCurrency(dayIncome).split(',')[0]}</span>
                                        </div>
                                    )}
                                    {dayExpense > 0 && (
                                        <div className="flex items-center justify-between text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                            <span className="font-bold">Keluar</span>
                                            <span>{formatCurrency(dayExpense).split(',')[0]}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Calendar Detail Modal */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setSelectedDate(null)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-white/50 modal-animate overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-stone-500" />
                                {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => setSelectedDate(null)}><X className="w-5 h-5 text-stone-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3">
                            {getTransactionsForDate(new Date(selectedDate)).length === 0 ? (
                                <div className="text-center py-8 text-stone-400 text-sm">Tidak ada transaksi pada tanggal ini.</div>
                            ) : (
                                getTransactionsForDate(new Date(selectedDate)).map(t => (
                                    <div key={t.id} className="bg-white border border-stone-100 p-3 rounded-lg shadow-sm flex justify-between items-center group hover:border-stone-300 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold", CATEGORIES.find(c => c.name === t.category)?.color)}>{t.category}</span>
                                                <span className="text-[10px] text-stone-400">ID: {t.id}</span>
                                            </div>
                                            <h4 className="font-bold text-stone-800 text-sm">{t.description}</h4>
                                        </div>
                                        <div className="text-right">
                                            {(t.actIncome > 0 || t.planIncome > 0) && (
                                                <div className="text-emerald-600 font-bold text-xs">+{formatCurrency(t.actIncome || t.planIncome)}</div>
                                            )}
                                            {(t.actExpense > 0 || t.planExpense > 0) && (
                                                <div className="text-rose-600 font-bold text-xs">-{formatCurrency(t.actExpense || t.planExpense)}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 flex justify-end">
                            <button onClick={() => setSelectedDate(null)} className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200 rounded-lg transition-colors">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
