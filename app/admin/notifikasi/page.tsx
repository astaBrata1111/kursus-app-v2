"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Send, CheckCircle, Users, CreditCard, Calendar, AlertCircle } from "lucide-react";

const TEMPLATES = [
    {
        id: 'invoice',
        label: 'Tagihan Belum Bayar',
        icon: <CreditCard size={20} />,
        color: '#F59E0B',
        description: 'Kirim pengingat tagihan ke semua murid yang belum membayar',
        buildMessage: (nama: string, bulan: string, nominal: number) =>
            `📄 *Tagihan Kursus*\n\nYth. Wali Murid *${nama}*,\n\nTagihan bulan *${bulan}* sebesar *Rp ${nominal.toLocaleString('id-ID')}* belum kami terima.\n\nMohon segera lakukan pembayaran. Terima kasih! 🙏\n\n_– Tim Mingxian_`,
    },
    {
        id: 'reminder',
        label: 'Pengingat Kelas Besok',
        icon: <Calendar size={20} />,
        color: '#8B5CF6',
        description: 'Kirim pengingat kelas besok ke seluruh murid aktif',
        buildMessage: (nama: string, kelas: string, jam: string) =>
            `⏰ *Pengingat Kelas*\n\nHai *${nama}*, jangan lupa kelas *${kelas}* besok pukul *${jam}*! 📚\n\n_– Tim Mingxian_`,
    },
    {
        id: 'custom',
        label: 'Pesan Custom',
        icon: <MessageSquare size={20} />,
        color: '#3B82F6',
        description: 'Tulis pesan bebas dan kirim ke nomor tertentu atau semua murid',
        buildMessage: (_: any) => '',
    },
];

export default function NotifikasiPage() {
    const [activeTab, setActiveTab] = useState('invoice');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
    const [customMsg, setCustomMsg] = useState('');
    const [target, setTarget] = useState<'all' | 'custom'>('all');
    const [customPhone, setCustomPhone] = useState('');

    async function handleSend() {
        setSending(true);
        setResult(null);
        try {
            let success = 0, failed = 0;

            if (activeTab === 'invoice') {
                // Fetch unpaid invoices
                const { data: inv } = await supabase
                    .from('invoices').select('*, students(nama, telepon)')
                    .eq('status', 'Belum Bayar');

                for (const i of (inv || [])) {
                    const phone = (i as any).students?.telepon;
                    if (!phone) { failed++; continue; }
                    const msg = (TEMPLATES[0].buildMessage as any)((i as any).students?.nama, i.bulan, i.nominal);
                    const res = await fetch('/api/send-whatsapp', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone, message: msg }),
                    });
                    const json = await res.json();
                    json.success ? success++ : failed++;

                    // Log to wa_log
                    await supabase.from('wa_log').insert({
                        target_phone: phone, pesan: msg, status: json.success ? 'sent' : 'failed',
                        trigger_type: 'invoice_reminder',
                    });
                }
            } else if (activeTab === 'custom') {
                if (target === 'custom') {
                    if (!customPhone || !customMsg) { alert('Isi nomor dan pesan!'); setSending(false); return; }
                    const res = await fetch('/api/send-whatsapp', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: customPhone, message: customMsg }),
                    });
                    const json = await res.json();
                    json.success ? success++ : failed++;
                } else {
                    const { data: students } = await supabase.from('students').select('telepon, nama').not('telepon', 'is', null);
                    for (const s of (students || [])) {
                        if (!s.telepon) { failed++; continue; }
                        const res = await fetch('/api/send-whatsapp', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: s.telepon, message: customMsg }),
                        });
                        const json = await res.json();
                        json.success ? success++ : failed++;
                    }
                }
            }

            setResult({ success, failed });
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#25D366' }}>
                        <MessageSquare size={22} />
                    </div>
                    Notifikasi WhatsApp
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Kirim pesan WA otomatis via Fonnte API
                </p>
            </div>

            {/* Setup info */}
            <div className="card p-4 flex items-start gap-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <CheckCircle size={20} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                    <p style={{ fontWeight: 700, color: '#065F46', fontSize: '0.875rem' }}>Provider: Fonnte</p>
                    <p style={{ fontSize: '0.8rem', color: '#047857' }}>
                        Daftarkan nomor WA di <strong>fonnte.com</strong>, isi <code>FONNTE_API_TOKEN</code> di .env.local.
                        Tarif mulai Rp 25/pesan atau paket flat bulanan.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                        style={{
                            background: activeTab === t.id ? t.color : 'var(--bg-secondary)',
                            color: activeTab === t.id ? 'white' : 'var(--text-muted)',
                            border: `1.5px solid ${activeTab === t.id ? t.color : 'var(--border)'}`,
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Active template card */}
            {TEMPLATES.map(templ => activeTab === templ.id && (
                <div key={templ.id} className="card p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: templ.color }}>
                            {templ.icon}
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{templ.label}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{templ.description}</p>
                        </div>
                    </div>

                    {templ.id === 'custom' && (
                        <>
                            <div className="flex gap-3">
                                {(['all', 'custom'] as const).map(opt => (
                                    <button key={opt} onClick={() => setTarget(opt)}
                                        className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                        style={{
                                            background: target === opt ? 'var(--primary)' : 'var(--bg-secondary)',
                                            color: target === opt ? 'white' : 'var(--text-muted)',
                                            border: `1.5px solid ${target === opt ? 'var(--primary)' : 'var(--border)'}`,
                                        }}>
                                        {opt === 'all' ? <><Users size={14} className="inline mr-1" />Semua Murid</> : 'Nomor Tertentu'}
                                    </button>
                                ))}
                            </div>
                            {target === 'custom' && (
                                <input className="input-base" placeholder="Contoh: 08123456789"
                                    value={customPhone} onChange={e => setCustomPhone(e.target.value)} />
                            )}
                            <textarea className="input-base" rows={5} placeholder="Tulis pesan WhatsApp di sini..."
                                value={customMsg} onChange={e => setCustomMsg(e.target.value)} />
                        </>
                    )}

                    {result && (
                        <div className="p-4 rounded-xl" style={{
                            background: result.failed === 0 ? '#ECFDF5' : result.success === 0 ? '#FEF2F2' : '#FFF7ED',
                            border: `1px solid ${result.failed === 0 ? '#A7F3D0' : result.success === 0 ? '#FCA5A5' : '#FDE68A'}`,
                        }}>
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: result.failed === 0 ? '#059669' : '#DC2626' }}>
                                ✅ Terkirim: {result.success} &nbsp; ❌ Gagal: {result.failed}
                            </p>
                        </div>
                    )}

                    <button onClick={handleSend} disabled={sending} className="btn-primary">
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Send size={18} /> Kirim Sekarang</>
                        )}
                    </button>
                </div>
            ))}

            {/* WA Log */}
            <WALog />
        </div>
    );
}

function WALog() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    const load = async () => {
        const { data } = await supabase.from('wa_log').select('*').order('created_at', { ascending: false }).limit(20);
        if (data) setLogs(data);
        setLoaded(true);
    };

    return (
        <div className="card overflow-hidden">
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Log Pengiriman WA</h3>
                {!loaded && (
                    <button onClick={load} className="btn-ghost text-sm">Muat Log</button>
                )}
            </div>
            {loaded && (
                <div className="overflow-x-auto">
                    <table className="table-base">
                        <thead><tr><th>Nomor</th><th>Trigger</th><th>Status</th><th>Waktu</th></tr></thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.id}>
                                    <td style={{ fontWeight: 600 }}>{l.target_phone}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{l.trigger_type}</td>
                                    <td>
                                        <span className={`badge ${l.status === 'sent' ? 'badge-green' : 'badge-red'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(l.created_at).toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Belum ada log</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
