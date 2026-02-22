"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, CreditCard, UserCheck, BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react";
import CalendarWidget from "@/app/components/CalendarWidget";

export default function StudentDashboard() {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [absensi, setAbsensi] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('user_profiles').select('student_id, email').eq('id', user.id).single();

            if (profile?.student_id) {
                const [{ data: s }, { data: inv }, { data: abs }] = await Promise.all([
                    supabase.from('students').select('*').eq('id', profile.student_id).single(),
                    supabase.from('invoices').select('*').eq('student_id', profile.student_id).order('created_at', { ascending: false }),
                    supabase.from('absensi').select('*, sessions(nama_kelas)').eq('student_id', profile.student_id).order('tanggal', { ascending: false }).limit(10),
                ]);
                if (s) setStudent(s);
                if (inv) setInvoices(inv);
                if (abs) setAbsensi(abs);
            }

            setLoading(false);
        })();
    }, []);

    const pending = invoices.find(i => i.status === 'Belum Bayar');
    const hadirCount = absensi.filter(a => a.status === 'hadir').length;
    const hadirPct = absensi.length > 0 ? Math.round((hadirCount / absensi.length) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="card-amber p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-black">
                        {student?.nama?.[0] || '?'}
                    </div>
                    <div>
                        <p className="text-white/70 text-sm font-semibold">Selamat Datang,</p>
                        <h1 className="text-white font-black text-2xl">{student?.nama || 'Murid'}</h1>
                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '99px' }}>
                            {student?.level || 'General'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card p-5">
                    <UserCheck size={22} style={{ color: '#10B981', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kehadiran</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981' }}>{hadirPct}%</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hadirCount}/{absensi.length} sesi</p>
                </div>
                <div className="card p-5">
                    <CreditCard size={22} style={{ color: pending ? '#DC2626' : '#10B981', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tagihan</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 900, color: pending ? '#DC2626' : '#10B981' }}>
                        {pending ? `Rp ${pending.nominal.toLocaleString('id-ID')}` : 'Lunas ✓'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{pending?.bulan || 'Semua terbayar'}</p>
                </div>
                <div className="card p-5">
                    <Calendar size={22} style={{ color: '#8B5CF6', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kelas</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6' }}>{sessions.length}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>sesi aktif</p>
                </div>
            </div>

            {pending && (
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                    <AlertCircle style={{ color: '#DC2626', flexShrink: 0 }} size={20} />
                    <div>
                        <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.875rem' }}>
                            Tagihan {pending.bulan} belum dibayar
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#9B1C1C' }}>
                            Rp {pending.nominal.toLocaleString('id-ID')}
                            {pending.due_date && ` · Jatuh tempo: ${pending.due_date}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <CalendarWidget sessions={sessions} />

            {/* Absensi history */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Riwayat Kehadiran</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                    {absensi.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4">
                            <div>
                                <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{(a.sessions as any)?.nama_kelas || 'Kelas'}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.tanggal}</p>
                            </div>
                            <span className={`badge status-${a.status}`}>{a.status}</span>
                        </div>
                    ))}
                    {absensi.length === 0 && (
                        <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>Belum ada riwayat absensi</div>
                    )}
                </div>
            </div>
        </div>
    );
}
