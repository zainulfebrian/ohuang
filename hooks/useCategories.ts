import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../constants';

export interface Category {
    name: string;
    color: string;
}

const STORAGE_KEY = 'ohm_custom_categories';

const COLOR_PRESETS = [
    { label: 'Hijau', tailwind: 'bg-emerald-100 text-emerald-800', hex: '#d1fae5' },
    { label: 'Biru', tailwind: 'bg-blue-100 text-blue-800', hex: '#dbeafe' },
    { label: 'Oranye', tailwind: 'bg-orange-100 text-orange-800', hex: '#ffedd5' },
    { label: 'Merah', tailwind: 'bg-red-100 text-red-800', hex: '#fee2e2' },
    { label: 'Ungu', tailwind: 'bg-purple-100 text-purple-800', hex: '#f3e8ff' },
    { label: 'Teal', tailwind: 'bg-teal-100 text-teal-800', hex: '#ccfbf1' },
    { label: 'Abu-Abu', tailwind: 'bg-zinc-100 text-zinc-800', hex: '#f4f4f5' },
    { label: 'Kuning', tailwind: 'bg-yellow-100 text-yellow-800', hex: '#fef9c3' },
    { label: 'Pink', tailwind: 'bg-pink-100 text-pink-800', hex: '#fce7f3' },
    { label: 'Indigo', tailwind: 'bg-indigo-100 text-indigo-800', hex: '#e0e7ff' },
];

export { COLOR_PRESETS };

/** Merges default categories with user-defined custom ones (persisted in localStorage). */
export function useCategories() {
    const [customCategories, setCustomCategories] = useState<Category[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
    }, [customCategories]);

    // Merged list: built-in first, then custom (de-duplicated by name)
    const allCategories: Category[] = [
        ...CATEGORIES,
        ...customCategories.filter(c => !CATEGORIES.find(d => d.name.toLowerCase() === c.name.toLowerCase())),
    ];

    const addCategory = useCallback((name: string, color: string) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        if (allCategories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) return false; // duplicate
        setCustomCategories(prev => [...prev, { name: trimmed, color }]);
        return true;
    }, [allCategories]);

    const removeCategory = useCallback((name: string) => {
        // Only allow removing custom categories, not built-ins
        if (CATEGORIES.find(c => c.name === name)) return;
        setCustomCategories(prev => prev.filter(c => c.name !== name));
    }, []);

    return { allCategories, customCategories, addCategory, removeCategory };
}
