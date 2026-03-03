'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Users, TrendingUp, AlertTriangle, Calendar,
    BarChart2, DollarSign, ChevronRight, Crown,
} from 'lucide-react';

interface Stats {
    activeStudents: number;
    atRiskStudents: number;
    renewalsIn30: number;
    trialConversionRate: number;
    attendanceRate: number;
    revenueForecast: number;
}

export default function OwnerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // Role guard — AppShell already handles session, but double-check role
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase
                .from('user_profiles').select('role').eq('id', user.id).single();
            if (profile && profile.role !== 'owner') {
                router.replace('/admin');
                return;
            }

            // Fetch all 5 stats in parallel
            const [
                { count: active },
                { count: atRisk },
                { count: renewals },
                { count: totalTrials },
                { count: convertedTrials },
            ] = await Promise.all([
                // The `students` table currently does not have status, archived_at, or end_date.
                supabase.from('students').select('*', { count: 'exact', head: true }),
                // Placeholder for atRisk since we do not have absences tracking yet
                Promise.resolve({ count: 0 }),
                // Placeholder for renewals since we do not trace subscription expiration yet
                Promise.resolve({ count: 0 }),
                supabase.from('trials').select('*', { count: 'exact', head: true }),
                supabase.from('trials').select('*', { count: 'exact', head: true }).eq('status', 'attended'),
            ]);

            setStats({
                activeStudents: active ?? 0,
                atRiskStudents: atRisk ?? 0,
                renewalsIn30: renewals ?? 0,
                trialConversionRate: totalTrials ? Math.round(((convertedTrials ?? 0) / totalTrials) * 100) : 0,
                attendanceRate: 85, // placeholder — compute from absensi when populated
                revenueForecast: (active ?? 0) * 350000,
            });
            setLoading(false);
        })();
    }, [router]);

    const widgets = stats ? [
        {
            label: 'Murid Aktif', value: stats.activeStudents, suffix: 'murid',
            icon: Users, color: 'var(--success)', bg: 'var(--success-bg)',
            link: '/admin/murid',
        },
        {
            label: 'Perlu Perhatian', value: stats.atRiskStudents, suffix: 'murid',
            icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-bg)',
            link: '/admin/murid',
        },
        {
            label: 'Perpanjangan 30 Hari', value: stats.renewalsIn30, suffix: 'murid',
            icon: Calendar, color: 'var(--primary)', bg: 'var(--bg-secondary)',
            link: '/admin/murid',
        },
        {
            label: 'Konversi Trial', value: stats.trialConversionRate, suffix: '%',
            icon: TrendingUp,
            color: stats.trialConversionRate >= 60 ? 'var(--success)' : 'var(--warning)',
            bg: stats.trialConversionRate >= 60 ? 'var(--success-bg)' : 'var(--warning-bg)',
            link: '/admin/trials',
        },
        {
            label: 'Kehadiran 30 Hari', value: stats.attendanceRate, suffix: '%',
            icon: BarChart2,
            color: stats.attendanceRate >= 80 ? 'var(--success)' : 'var(--warning)',
            bg: stats.attendanceRate >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)',
            link: '/admin/absensi',
        },
        {
            label: 'Proyeksi Pendapatan', value: `Rp ${(stats.revenueForecast / 1e6).toFixed(1)}jt`, suffix: '/bln',
            icon: DollarSign, color: 'var(--primary-dark)', bg: 'var(--bg-secondary)',
            link: null,
        },
    ] : [];

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #92400E, #B45309)' }}>
                    <Crown size={20} className="text-white" />
                </div>
                <div>
                    <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        Dashboard Eksekutif
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                        Ringkasan operasional Mingxian — Owner view
                    </p>
                </div>
            </div>

            {/* 6-widget grid */}
            <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                    Indikator Utama
                </p>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {widgets.map(w => {
                            const Icon = w.icon;
                            return (
                                <div
                                    key={w.label}
                                    onClick={() => w.link && router.push(w.link)}
                                    className="card p-5 transition-all hover:shadow-md"
                                    style={{
                                        cursor: w.link ? 'pointer' : 'default',
                                        borderLeft: `4px solid ${w.color}`,
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: w.bg }}>
                                            <Icon size={16} style={{ color: w.color }} />
                                        </div>
                                        {w.link && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                                    </div>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                                        {w.value}
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
                                            {w.suffix}
                                        </span>
                                    </p>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {w.label}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Owner access note */}
            <div className="card p-4 text-sm" style={{ borderLeft: '4px solid #B45309' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    👑 Akses Owner (Super Admin)
                </p>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Gunakan sidebar untuk mengakses semua modul — termasuk Laporan, Pengaturan, dan Notifikasi WA yang eksklusif untuk Owner.
                </p>
            </div>
        </div>
    );
}
