"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart2, TrendingUp, Users, CreditCard, UserCheck, Download } from "lucide-react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function LaporanPage() {
    const [loading, setLoading] = useState(true);
    const [revenueChart, setRevenueChart] = useState<any>(null);
    const [absensiChart, setAbsensiChart] = useState<any>(null);
    const [levelChart, setLevelChart] = useState<any>(null);
    const [stats, setStats] = useState({ totalMurid: 0, rataAbsensi: 0, tunggakan: 0, active: 0 });

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        const now = new Date();

        const [{ data: inv }, { data: students }, { data: absensi }] = await Promise.all([
            supabase.from('invoices').select('nominal, status, bulan'),
            supabase.from('students').select('id, level, created_at'),
            supabase.from('absensi').select('status'),
        ]);

        // Stats
        const tunggakan = inv?.filter(i => i.status === 'Belum Bayar').reduce((a, i) => a + i.nominal, 0) || 0;
        const hadirCnt = absensi?.filter(a => a.status === 'hadir').length || 0;
        const totalAbs = absensi?.length || 1;
        setStats({
            totalMurid: students?.length || 0,
            rataAbsensi: Math.round((hadirCnt / totalAbs) * 100),
            tunggakan, active: students?.length || 0,
        });

        // Revenue 6 months
        const revLabels: string[] = [], revData: number[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            const bulan = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            const val = inv?.filter(x => x.status === 'Lunas' && x.bulan === bulan).reduce((a, x) => a + x.nominal, 0) || 0;
            revLabels.push(label); revData.push(val / 1_000_000);
        }
        setRevenueChart({
            labels: revLabels,
            datasets: [{
                label: 'Pendapatan (Juta Rp)', data: revData,
                backgroundColor: 'rgba(245,158,11,0.2)',
                borderColor: '#F59E0B', borderWidth: 2.5, fill: true, tension: 0.4,
                pointBackgroundColor: '#F59E0B',
            }],
        });

        // Absensi donut
        const statCounts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
        absensi?.forEach(a => { if (statCounts[a.status as keyof typeof statCounts] !== undefined) (statCounts as any)[a.status]++; });
        setAbsensiChart({
            labels: ['Hadir', 'Izin', 'Sakit', 'Alpha'],
            datasets: [{
                data: [statCounts.hadir, statCounts.izin, statCounts.sakit, statCounts.alpha],
                backgroundColor: ['#16A34A', '#2563EB', '#D97706', '#DC2626'],
                borderWidth: 0
            }],
        });

        // Level distribution
        const levelCnt: Record<string, number> = {};
        students?.forEach(s => { const l = s.level || 'General'; levelCnt[l] = (levelCnt[l] || 0) + 1; });
        setLevelChart({
            labels: Object.keys(levelCnt),
            datasets: [{
                data: Object.values(levelCnt),
                backgroundColor: ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899', '#6B7280'],
                borderWidth: 0
            }],
        });

        setLoading(false);
    }

    const chartOpts = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'white', titleColor: '#1C1917', bodyColor: '#78716C', borderColor: '#FDE68A', borderWidth: 1 },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#78716C', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#78716C', font: { size: 11 } }, beginAtZero: true },
        },
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#3B82F6' }}>
                        <BarChart2 size={22} />
                    </div>
                    Laporan &amp; Analitik
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Ringkasan performa operasional kursus
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Murid', val: stats.totalMurid, icon: <Users size={20} />, bg: '#F59E0B', text: '#92400E' },
                    { label: 'Rata Absensi', val: `${stats.rataAbsensi}%`, icon: <UserCheck size={20} />, bg: '#10B981', text: '#065F46' },
                    { label: 'Tunggakan', val: `Rp ${(stats.tunggakan / 1e6).toFixed(1)}jt`, icon: <CreditCard size={20} />, bg: '#DC2626', text: '#7F1D1D' },
                    { label: 'Murid Aktif', val: stats.active, icon: <TrendingUp size={20} />, bg: '#3B82F6', text: '#1E3A8A' },
                ].map(s => (
                    <div key={s.label} className="card p-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3"
                            style={{ background: s.bg }}>{s.icon}</div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.text }}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 card p-6">
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Tren Pendapatan (6 Bulan)</h3>
                    {revenueChart ? <Line data={revenueChart} options={chartOpts as any} height={80} /> : <div className="h-48 skeleton" />}
                </div>
                <div className="card p-6">
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Distribusi Absensi</h3>
                    {absensiChart ? (
                        <div className="flex flex-col items-center">
                            <Doughnut data={absensiChart} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
                        </div>
                    ) : <div className="h-48 skeleton" />}
                </div>
            </div>

            <div className="card p-6">
                <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Distribusi Level Murid</h3>
                {levelChart ? (
                    <div className="max-w-sm mx-auto">
                        <Doughnut data={levelChart} options={{ plugins: { legend: { position: 'right' } }, cutout: '60%' }} />
                    </div>
                ) : <div className="h-48 skeleton" />}
            </div>
        </div>
    );
}
