import React from 'react';
import {
    Waves, ShieldCheck, CloudOff, BarChart3, CalendarDays,
    Target, FileDown, Smartphone, Github, Heart,
    Instagram, History, Megaphone, CheckCircle2
} from 'lucide-react';

interface AboutViewProps {
    appVersion: string;
}

const features = [
    { Icon: BarChart3, label: 'Analitik Keuangan', desc: 'Grafik distribusi pengeluaran & rekomendasi pintar', color: 'text-violet-500', bg: 'bg-violet-50' },
    { Icon: CalendarDays, label: 'Kalender Transaksi', desc: 'Visualisasi transaksi harian lewat kalender interaktif', color: 'text-amber-500', bg: 'bg-amber-50' },
    { Icon: Target, label: 'Manajemen Anggaran', desc: 'Pantau pengeluaran per kategori vs batas anggaran', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { Icon: FileDown, label: 'Ekspor PDF & Excel', desc: 'Unduh laporan keuangan lengkap kapan saja', color: 'text-rose-500', bg: 'bg-rose-50' },
    { Icon: CloudOff, label: 'Offline First', desc: 'Data tersimpan lokal, tidak butuh koneksi internet', color: 'text-blue-500', bg: 'bg-blue-50' },
    { Icon: Smartphone, label: 'Mobile Ready', desc: 'Tersedia sebagai aplikasi Android via Capacitor', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { Icon: ShieldCheck, label: 'Privasi Terjaga', desc: 'Tidak ada data yang dikirim ke server manapun', color: 'text-teal-500', bg: 'bg-teal-50' },
];

export function AboutView({ appVersion }: AboutViewProps) {
    return (
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

            {/* Hero Card */}
            <div
                className="rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1b2a4a 100%)' }}
            >
                {/* Decorative blob */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />

                <img
                    src="/logo.png"
                    alt="OhMonsea"
                    className="h-16 w-auto object-contain mb-4 relative z-10"
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
                {/* <h1 className="text-white text-xl font-black tracking-tight relative z-10">OhMonsea</h1> */}
                <p className="text-white/50 text-xs mt-1 uppercase tracking-[0.2em] relative z-10">Self Finance</p>
                <div className="mt-3 flex items-center gap-3 relative z-10">
                    <span className="text-white/30 text-[10px] bg-white/10 px-2 py-0.5 rounded-full">v{appVersion}</span>
                    <span className="text-white/30 text-[10px]">•</span>
                    <span className="text-white/30 text-[10px]">by hanya.rian</span>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-bold text-stone-800">Tentang Aplikasi</h2>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                    <strong className="text-stone-700">OhMonsea Self Finance</strong> adalah aplikasi manajemen keuangan pribadi yang dirancang
                    untuk membantu Anda merencanakan, memantau, dan menganalisis kondisi keuangan secara cerdas.
                    Dibangun dengan teknologi web modern dan dapat berjalan sebagai aplikasi Android native.
                </p>
                <p className="text-xs text-stone-500 leading-relaxed">
                    Semua data Anda tersimpan secara lokal di perangkat — tidak ada server, tidak ada langganan,
                    tidak ada iklan. Privasi Anda adalah prioritas utama.
                </p>
            </div>

            {/* Features Grid */}
            <div>
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">Fitur Unggulan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map(({ Icon, label, desc, color, bg }) => (
                        <div key={label} className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-start gap-3 hover:-translate-y-0.5 transition-all">
                            <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-stone-700">{label}</p>
                                <p className="text-[10px] text-stone-400 mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* What's New */}
            <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-sm font-bold text-stone-800">Apa yang Baru? (v4.0.0)</h2>
                </div>
                <div className="space-y-3">
                    <ul className="text-xs text-stone-600 space-y-2">
                        <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span><strong>Optimisasi Form:</strong> Pemisahan Pemasukan & Pengeluaran lebih jelas.</span></li>
                        <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span><strong>Mobile Download:</strong> Fitur unduh file JSON, Excel, & PDF langsung ke folder Download di Android dengan notifikasi.</span></li>
                        <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span><strong>Notifikasi Toast:</strong> Sistem notifikasi modern bawaan tanpa pop-up browser. Termasuk notifikasi Auto-Save.</span></li>
                        <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span><strong>UI/UX:</strong> Penyederhanaan tombol tabel (opsi titik tiga), ikon baru, dan Tooltip bantuan pintar di seluruh platform.</span></li>
                    </ul>
                </div>
            </div>

            {/* Contact Me */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-bold text-stone-800">Hubungi Saya (Contact)</h2>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed mb-4">
                    Punya pertanyaan, saran fitur, atau sekadar ingin menyapa? Jangan ragu untuk menghubungi saya melalui Instagram.
                </p>
                <a
                    href="https://instagram.com/hanya.rian"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                    <Instagram className="w-4 h-4" />
                    @hanya.rian
                </a>
            </div>

            {/* Footer credit */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
                    <span>Dibuat dengan</span>
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>oleh</span>
                    <span className="font-bold text-stone-700">hanya.rian</span>
                </div>
                <p className="text-[10px] text-stone-400">React · TypeScript · Capacitor · Tailwind CSS</p>
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-stone-400">
                    <Github className="w-3 h-3" />
                    <span>OhMonsea Finance Plan</span>
                </div>
            </div>

            <div className="h-4" />
        </div>
    );
}
