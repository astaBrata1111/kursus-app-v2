"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    ClipboardList, RefreshCw, CheckCircle2, Circle, Calendar,
    CreditCard, Users, AlertTriangle, ChevronRight, Clock, Zap
} from "lucide-react";
import Link from "next/link";

interface CheckItem {
    id: string; label: string; description: string;
    category: "jadwal" | "keuangan" | "murid" | "sistem"; link?: string;
}

const CHECKLIST_ITEMS: CheckItem[] = [
    { id: "cek-jadwal-hari-ini", label: "Cek jadwal kelas hari ini", description: "Pastikan semua kelas terjadwal sudah memiliki pengajar dan ruangan.", category: "jadwal", link: "/admin/jadwal" },
    { id: "konfirmasi-ruangan", label: "Konfirmasi ketersediaan ruangan", description: "Verifikasi tidak ada konflik ruangan pada jadwal hari ini.", category: "jadwal", link: "/admin/ruangan" },
    { id: "cek-absensi", label: "Input absensi kelas hari ini", description: "Tandai kehadiran murid untuk setiap sesi kelas.", category: "jadwal", link: "/admin/absensi" },
    { id: "cek-tagihan", label: "Cek tagihan jatuh tempo", description: "Identifikasi murid yang tagihan pembayarannya jatuh tempo.", category: "keuangan", link: "/admin/pembayaran" },
    { id: "konfirmasi-bayar", label: "Konfirmasi pembayaran masuk", description: "Tandai invoice yang sudah dibayar hari ini sebagai 'Lunas'.", category: "keuangan", link: "/admin/pembayaran" },
    { id: "rekap-pendapatan", label: "Rekap pendapatan harian", description: "Catat total pemasukan yang sudah dikonfirmasi hari ini.", category: "keuangan" },
    { id: "proses-murid-baru", label: "Proses pendaftaran murid baru", description: "Lengkapi data, buat invoice pertama, jadwalkan kelas perdana.", category: "murid", link: "/admin/murid" },
    { id: "followup-absen", label: "Follow-up murid alpha", description: "Hubungi orang tua murid yang tidak hadir tanpa keterangan.", category: "murid", link: "/admin/absensi" },
    { id: "update-progress", label: "Update progress belajar murid", description: "Koordinasi dengan pengajar untuk update catatan perkembangan.", category: "murid" },
    { id: "backup-data", label: "Verifikasi backup Supabase", description: "Pastikan backup otomatis Supabase berjalan di dashboard.", category: "sistem" },
    { id: "cek-wa-notif", label: "Review log WhatsApp", description: "Periksa apakah ada pesan WA yang gagal terkirim.", category: "sistem", link: "/admin/notifikasi" },
    { id: "update-info", label: "Update informasi kursus jika ada perubahan", description: "Perbarui harga, jadwal, atau deskripsi kelas jika ada perubahan.", category: "sistem" },
];

const CAT_META = {
    jadwal: { label: "📅 Jadwal & Kelas", gradient: "from-blue-500 to-indigo-600", bg: "#EFF6FF", border: "#BFDBFE", badge: "#DBEAFE", badgeText: "#1D4ED8" },
    keuangan: { label: "💰 Keuangan", gradient: "from-emerald-500 to-teal-600", bg: "#ECFDF5", border: "#A7F3D0", badge: "#D1FAE5", badgeText: "#065F46" },
    murid: { label: "👨‍🎓 Murid & Pengajar", gradient: "from-violet-500 to-purple-600", bg: "#F5F3FF", border: "#DDD6FE", badge: "#EDE9FE", badgeText: "#5B21B6" },
    sistem: { label: "⚙️ Sistem & Data", gradient: "from-amber-500 to-orange-600", bg: "#FFFBEB", border: "#FDE68A", badge: "#FEF3C7", badgeText: "#92400E" },
};

function getTodayKey() { return `checklist-v2-${new Date().toISOString().slice(0, 10)}`; }

interface LiveData { jadwalHariIni: number; tagihanBelumBayar: number; muridBaru7Hari: number; jadwalTanpaRuangan: number; }

export default function ChecklistPage() {
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [liveData, setLiveData] = useState<LiveData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const todayStr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    useEffect(() => {
        const saved = localStorage.getItem(getTodayKey());
        if (saved) setChecked(new Set(JSON.parse(saved)));
        fetchLiveData();
    }, []);

    useEffect(() => {
        if (checked.size > 0) localStorage.setItem(getTodayKey(), JSON.stringify([...checked]));
    }, [checked]);

    async function fetchLiveData() {
        setLoadingData(true);
        try {
            const today = new Date();
            const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const todayName = dayNames[today.getDay()];

            const [
                { count: jadwalHariIni },
                { data: invoices },
                { data: muridBaru },
                { count: tanpaRuangan },
            ] = await Promise.all([
                supabase.from("sessions").select("*", { count: "exact", head: true }).ilike("hari", `%${todayName}%`),
                supabase.from("invoices").select("status"),
                supabase.from("students").select("created_at").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
                supabase.from("sessions").select("*", { count: "exact", head: true }).is("room_id", null),
            ]);

            setLiveData({
                jadwalHariIni: jadwalHariIni || 0,
                tagihanBelumBayar: invoices?.filter(i => i.status !== 'Lunas').length || 0,
                muridBaru7Hari: muridBaru?.length || 0,
                jadwalTanpaRuangan: tanpaRuangan || 0,
            });
        } finally {
            setLoadingData(false);
            setLastRefresh(new Date());
        }
    }

    const toggle = (id: string) => {
        setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };
    const resetAll = () => { setChecked(new Set()); localStorage.removeItem(getTodayKey()); };

    const total = CHECKLIST_ITEMS.length;
    const done = checked.size;
    const pct = Math.round((done / total) * 100);

    const grouped = (["jadwal", "keuangan", "murid", "sistem"] as const).map(cat => ({
        cat, items: CHECKLIST_ITEMS.filter(i => i.category === cat),
    }));

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                                <ClipboardList size={22} />
                            </div>
                            Checklist Operasional
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📅 {todayStr}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchLiveData} disabled={loadingData} className="btn-ghost text-sm">
                            <RefreshCw size={15} className={loadingData ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <button onClick={resetAll} className="px-3 py-2 rounded-xl text-sm font-bold"
                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                            Reset
                        </button>
                    </div>
                </div>

                {/* Progress */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span style={{ fontWeight: 700 }}>{done} / {total} selesai</span>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: pct === 100 ? '#059669' : 'var(--primary-dark)' }}>
                            {pct}%
                        </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: '#F0ECE4' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: pct === 100 ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                            }} />
                    </div>
                    {pct === 100 && (
                        <p className="text-center mt-3 font-bold" style={{ color: '#059669', fontSize: '0.875rem' }}>
                            🎉 Semua checklist harian selesai!
                        </p>
                    )}
                </div>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { icon: <Calendar size={16} />, label: 'Kelas Hari Ini', val: liveData?.jadwalHariIni, warn: false, color: '#3B82F6' },
                    { icon: <CreditCard size={16} />, label: 'Tagihan Belum Bayar', val: liveData?.tagihanBelumBayar, warn: (liveData?.tagihanBelumBayar || 0) > 5, color: '#F59E0B' },
                    { icon: <Users size={16} />, label: 'Murid Baru (7 Hari)', val: liveData?.muridBaru7Hari, warn: false, color: '#8B5CF6' },
                    { icon: <AlertTriangle size={16} />, label: 'Jadwal Tanpa Ruangan', val: liveData?.jadwalTanpaRuangan, warn: (liveData?.jadwalTanpaRuangan || 0) > 0, color: '#DC2626' },
                ].map(s => (
                    <div key={s.label} className="card p-3" style={{ border: s.warn ? '1.5px solid #FCA5A5' : undefined }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-2"
                            style={{ background: s.color }}>{s.icon}</div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 900, color: s.warn ? '#DC2626' : 'var(--text-primary)' }}>
                            {loadingData ? '...' : s.val ?? 0}
                        </p>
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> Data diperbarui: {lastRefresh.toLocaleTimeString('id-ID')}
            </p>

            {/* Checklist groups */}
            <div className="space-y-4">
                {grouped.map(({ cat, items }) => {
                    const meta = CAT_META[cat];
                    const catDone = items.filter(i => checked.has(i.id)).length;
                    return (
                        <div key={cat} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${meta.border}` }}>
                            <div className={`px-5 py-3.5 flex items-center justify-between bg-gradient-to-r ${meta.gradient}`}>
                                <h2 className="text-white font-bold">{meta.label}</h2>
                                <span className="text-white/80 text-sm font-bold bg-white/20 px-3 py-0.5 rounded-full">
                                    {catDone}/{items.length}
                                </span>
                            </div>
                            <div style={{ background: meta.bg }}>
                                {items.map((item, idx) => {
                                    const isDone = checked.has(item.id);
                                    return (
                                        <div key={item.id} onClick={() => toggle(item.id)}
                                            className="flex items-start gap-4 px-5 py-4 cursor-pointer select-none transition-all"
                                            style={{
                                                borderBottom: idx < items.length - 1 ? `1px solid ${meta.border}` : 'none',
                                                opacity: isDone ? 0.6 : 1,
                                            }}>
                                            <div className="mt-0.5 shrink-0 transition-all" style={{ color: isDone ? '#059669' : '#A8A29E' }}>
                                                {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                                            </div>
                                            <div className="flex-1">
                                                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                                                    {item.label}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            {item.link && !isDone && (
                                                <Link href={item.link} onClick={e => e.stopPropagation()}
                                                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                                                    style={{ background: meta.badge, color: meta.badgeText }}>
                                                    Buka <ChevronRight size={12} />
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card p-4 flex items-start gap-3">
                <Zap size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
                <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Checklist tersimpan otomatis per hari</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Progress tersimpan di browser. Besok checklist otomatis reset.
                    </p>
                </div>
            </div>
        </div>
    );
}
