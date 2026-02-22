"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Baby, Calendar, UserCheck, CreditCard, BookOpen, AlertCircle, TrendingUp } from "lucide-react";
import CalendarWidget from "@/app/components/CalendarWidget";

export default function ParentDashboard() {
    const [loading, setLoading] = useState(true);
    const [children, setChildren] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [absensi, setAbsensi] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('user_profiles').select('email').eq('id', user.id).single();

            // Find students linked to this parent's phone/email
            const { data: kids } = await supabase.from('students').select('*')
                .or(`parent_email.eq.${profile?.email},parent_phone.eq.${profile?.email}`);

            if (kids?.length) {
                setChildren(kids);
                loadChildData(kids[0]);
                setSelected(kids[0]);
            }
            setLoading(false);
        })();
    }, []);

    async function loadChildData(kid: any) {
        const [{ data: inv }, { data: abs }, { data: s }] = await Promise.all([
            supabase.from('invoices').select('*').eq('student_id', kid.id).order('created_at', { ascending: false }),
            supabase.from('absensi').select('*, sessions(nama_kelas)').eq('student_id', kid.id).order('tanggal', { ascending: false }).limit(10),
            supabase.from('sessions').select('*, rooms(nama_ruangan)'),
        ]);
        if (inv) setInvoices(inv);
        if (abs) setAbsensi(abs);
        if (s) setSessions(s);
    }

    const pendingInvoices = invoices.filter(i => i.status === 'Belum Bayar');
    const hadirPct = absensi.length > 0 ? Math.round((absensi.filter(a => a.status === 'hadir').length / absensi.length) * 100) : 0;

    if (loading) return <div className="page-container"><div className="h-40 skeleton rounded-2xl" /></div>;

    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Baby size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Belum ada data anak yang terhubung</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hubungi admin untuk menghubungkan akun Anda dengan data murid.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Portal Orang Tua 👪
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Pantau perkembangan anak Anda
                </p>
            </div>

            {/* Child selector */}
            {children.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {children.map(kid => (
                        <button key={kid.id} onClick={() => { setSelected(kid); loadChildData(kid); }}
                            className="px-4 py-2 rounded-xl font-bold text-sm transition-all"
                            style={{
                                background: selected?.id === kid.id ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: selected?.id === kid.id ? 'white' : 'var(--text-muted)',
                                border: `1.5px solid ${selected?.id === kid.id ? 'var(--primary)' : 'var(--border)'}`,
                            }}>
                            {kid.nama}
                        </button>
                    ))}
                </div>
            )}

            {selected && (
                <>
                    {/* Child profile card */}
                    <div className="card-amber p-6 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-black">
                                {selected.nama[0]}
                            </div>
                            <div>
                                <p className="text-white/70 text-sm font-semibold">Data Murid</p>
                                <h2 className="text-white font-black text-xl">{selected.nama}</h2>
                                <div className="flex gap-2 mt-1">
                                    <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '99px' }}>
                                        {selected.level || 'General'}
                                    </span>
                                    {selected.usia && (
                                        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '99px' }}>
                                            {selected.usia} Tahun
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="card p-5">
                            <UserCheck size={22} style={{ color: '#10B981', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kehadiran</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981' }}>{hadirPct}%</p>
                        </div>
                        <div className="card p-5">
                            <CreditCard size={22} style={{ color: pendingInvoices.length > 0 ? '#DC2626' : '#10B981', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tagihan Pending</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingInvoices.length > 0 ? '#DC2626' : '#10B981' }}>
                                {pendingInvoices.length}
                            </p>
                        </div>
                        <div className="card p-5">
                            <BookOpen size={22} style={{ color: '#8B5CF6', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tagihan</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#8B5CF6' }}>
                                Rp {invoices.reduce((a, i) => a + i.nominal, 0).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* Pending invoice alerts */}
                    {pendingInvoices.map(inv => (
                        <div key={inv.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                            <AlertCircle size={20} style={{ color: '#DC2626' }} />
                            <div>
                                <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.875rem' }}>
                                    Tagihan {inv.bulan}: Rp {inv.nominal.toLocaleString('id-ID')} belum dibayar
                                </p>
                                {inv.due_date && <p style={{ fontSize: '0.8rem', color: '#9B1C1C' }}>Jatuh tempo: {inv.due_date}</p>}
                            </div>
                        </div>
                    ))}

                    {/* Recent attendance */}
                    <div className="card overflow-hidden">
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Riwayat Kehadiran Terkini</h3>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                            {absensi.slice(0, 5).map(a => (
                                <div key={a.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{(a.sessions as any)?.nama_kelas}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.tanggal}</p>
                                    </div>
                                    <span className={`badge status-${a.status}`}>{a.status}</span>
                                </div>
                            ))}
                            {absensi.length === 0 && (
                                <div className="py-8 text-center" style={{ color: 'var(--text-muted)' }}>Belum ada data absensi</div>
                            )}
                        </div>
                    </div>

                    {/* Invoice table */}
                    <div className="card overflow-hidden">
                        <div className="p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Riwayat Tagihan</h3>
                        </div>
                        <table className="table-base">
                            <thead><tr><th>Periode</th><th>Nominal</th><th>Status</th></tr></thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td>{inv.bulan}</td>
                                        <td style={{ fontWeight: 700 }}>Rp {inv.nominal.toLocaleString('id-ID')}</td>
                                        <td><span className={`badge ${inv.status === 'Lunas' ? 'badge-green' : 'badge-red'}`}>{inv.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
