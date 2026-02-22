"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatsCard from "@/app/components/StatsCard";
import CalendarWidget from "@/app/components/CalendarWidget";
import {
    Users, GraduationCap, Home as HomeIcon, Calendar, CreditCard,
    TrendingUp, AlertCircle, CheckCircle, ArrowUpRight, Zap, Clock
} from "lucide-react";
import Link from "next/link";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface Stats {
    totalMurid: number;
    totalPengajar: number;
    totalRuangan: number;
    totalJadwal: number;
    totalInvoice: number;
    pendapatanBulanIni: number;
    tunggakan: number;
    absensiAlpha: number;
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalMurid: 0, totalPengajar: 0, totalRuangan: 0, totalJadwal: 0,
        totalInvoice: 0, pendapatanBulanIni: 0, tunggakan: 0, absensiAlpha: 0,
    });
    const [sessions, setSessions] = useState<any[]>([]);
    const [revenueChart, setRevenueChart] = useState<any>(null);
    const [studentChart, setStudentChart] = useState<any>(null);
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Selamat Pagi' :
        today.getHours() < 17 ? 'Selamat Siang' : 'Selamat Malam';
    const formattedDate = today.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [
                { count: murid },
                { count: pengajar },
                { count: ruangan },
                { count: jadwal },
                { data: inv },
                { data: studentsData },
                { data: sessionsData },
            ] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('rooms').select('*', { count: 'exact', head: true }),
                supabase.from('sessions').select('*', { count: 'exact', head: true }),
                supabase.from('invoices').select('id, nominal, status, created_at, students(nama), bulan').order('created_at', { ascending: false }),
                supabase.from('students').select('created_at'),
                supabase.from('sessions').select('*, teachers(nama), rooms(nama_ruangan)'),
            ]);

            setSessions(sessionsData || []);
            setRecentInvoices((inv || []).slice(0, 6));

            const now = new Date();
            const thisMonth = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            const pendapatanBulanIni = inv?.filter(i => i.status === 'Lunas' && i.bulan === thisMonth)
                .reduce((acc, i) => acc + i.nominal, 0) || 0;
            const tunggakan = inv?.filter(i => i.status === 'Belum Bayar')
                .reduce((acc, i) => acc + i.nominal, 0) || 0;

            setStats({
                totalMurid: murid || 0, totalPengajar: pengajar || 0,
                totalRuangan: ruangan || 0, totalJadwal: jadwal || 0,
                totalInvoice: inv?.length || 0,
                pendapatanBulanIni, tunggakan, absensiAlpha: 0,
            });

            // Revenue chart: last 6 months
            const revenueLabels: string[] = [];
            const revenueData: number[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                const bulanStr = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                const monthRevenue = inv?.filter(x => x.status === 'Lunas' && x.bulan === bulanStr)
                    .reduce((acc, x) => acc + x.nominal, 0) || 0;
                revenueLabels.push(label);
                revenueData.push(monthRevenue / 1_000_000); // million IDR
            }

            setRevenueChart({
                labels: revenueLabels,
                datasets: [{
                    label: 'Pendapatan (Juta Rp)',
                    data: revenueData,
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    borderColor: '#F59E0B',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#F59E0B',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }],
            });

            // Student trend: last 6 months
            const studentLabels: string[] = [];
            const studentData: number[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const label = d.toLocaleDateString('id-ID', { month: 'short' });
                const cnt = studentsData?.filter(s => {
                    const sd = new Date(s.created_at);
                    return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
                }).length || 0;
                studentLabels.push(label);
                studentData.push(cnt);
            }

            setStudentChart({
                labels: studentLabels,
                datasets: [{
                    label: 'Murid Baru',
                    data: studentData,
                    backgroundColor: 'rgba(16,185,129,0.8)',
                    borderRadius: 8,
                }],
            });
        } finally {
            setLoading(false);
        }
    }

    const chartOptions = (title: string, yLabel: string = '') => ({
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: 'white',
                titleColor: '#1C1917',
                bodyColor: '#78716C',
                borderColor: '#FDE68A',
                borderWidth: 1,
                padding: 10,
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#78716C', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#78716C', font: { size: 11 } }, beginAtZero: true },
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '1.6rem', color: 'var(--text-primary)' }}>
                        {greeting}, Admin! 👋
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                        {formattedDate} — ini ringkasan operasional hari ini.
                    </p>
                </div>
                <Link href="/admin/jadwal" className="btn-primary">
                    <Calendar size={18} /> Lihat Jadwal
                </Link>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <StatsCard label="Total Murid" value={stats.totalMurid} icon={<Users size={22} />} iconBg="#F59E0B" />
                <StatsCard label="Pengajar" value={stats.totalPengajar} icon={<GraduationCap size={22} />} iconBg="#3B82F6" />
                <StatsCard label="Total Jadwal" value={stats.totalJadwal} icon={<Calendar size={22} />} iconBg="#8B5CF6" />
                <StatsCard label="Ruangan" value={stats.totalRuangan} icon={<HomeIcon size={22} />} iconBg="#10B981" />
                <StatsCard
                    label="Pendapatan Bulan Ini"
                    value={`Rp ${(stats.pendapatanBulanIni / 1_000_000).toFixed(1)}jt`}
                    icon={<TrendingUp size={22} />}
                    iconBg="#16A34A"
                />
                <StatsCard
                    label="Belum Terbayar"
                    value={`Rp ${(stats.tunggakan / 1_000_000).toFixed(1)}jt`}
                    icon={<AlertCircle size={22} />}
                    iconBg="#DC2626"
                />
                <StatsCard label="Total Invoice" value={stats.totalInvoice} icon={<CreditCard size={22} />} iconBg="#F97316" />
                <StatsCard label="Absensi Alpha" value={stats.absensiAlpha} icon={<AlertCircle size={22} />} iconBg="#EF4444" />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="xl:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Tren Pendapatan</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6 bulan terakhir (dalam jutaan Rp)</p>
                        </div>
                        <span className="badge badge-amber">
                            <TrendingUp size={11} /> Revenue
                        </span>
                    </div>
                    {revenueChart ? (
                        <Line data={revenueChart} options={chartOptions('Revenue') as any} height={90} />
                    ) : (
                        <div className="h-[180px] skeleton" />
                    )}
                </div>

                {/* Calendar widget */}
                <CalendarWidget sessions={sessions} />
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Student bar chart */}
                <div className="card p-6">
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                        Murid Baru per Bulan
                    </h3>
                    {studentChart ? (
                        <Bar data={studentChart} options={chartOptions('Students') as any} height={160} />
                    ) : (
                        <div className="h-40 skeleton" />
                    )}
                </div>

                {/* Recent invoices */}
                <div className="xl:col-span-2 card overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Invoice Terbaru</h3>
                        <Link href="/admin/pembayaran" className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--primary-dark)' }}>
                            Lihat Semua <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Murid</th>
                                    <th>Periode</th>
                                    <th>Nominal</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 4 }).map((_, j) => (
                                                <td key={j}><div className="h-4 skeleton rounded" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : recentInvoices.map((inv, idx) => (
                                    <tr key={inv.id ?? idx}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ background: 'var(--primary)' }}>
                                                    {(inv.students?.nama || '?')[0]}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{inv.students?.nama || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{inv.bulan}</td>
                                        <td style={{ fontWeight: 700 }}>Rp {inv.nominal?.toLocaleString('id-ID')}</td>
                                        <td>
                                            <span className={`badge ${inv.status === 'Lunas' ? 'badge-green' : 'badge-red'}`}>
                                                {inv.status === 'Lunas' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="card p-6">
                <h3 className="mb-4" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Buat Jadwal', href: '/admin/jadwal', icon: <Calendar size={20} />, color: '#8B5CF6' },
                        { label: 'Tambah Murid', href: '/admin/murid', icon: <Users size={20} />, color: '#10B981' },
                        { label: 'Buat Invoice', href: '/admin/pembayaran', icon: <CreditCard size={20} />, color: '#F59E0B' },
                        { label: 'Notifikasi WA', href: '/admin/notifikasi', icon: <Zap size={20} />, color: '#3B82F6' },
                    ].map(a => (
                        <Link key={a.href} href={a.href}
                            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:shadow-md group"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                                style={{ background: a.color }}>
                                {a.icon}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
