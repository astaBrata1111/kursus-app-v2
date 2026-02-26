"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import EditModal from "@/app/components/EditModal";
import ModalPortal from "@/app/components/ModalPortal";
import {
    CreditCard, Plus, CheckCircle, Clock, Search, Trash2, X, Save,
    User, DollarSign, Calendar, Pencil, Upload, Download, Sparkles,
    AlertCircle, Send
} from "lucide-react";
import { isFirstFriday } from "@/lib/invoice-generator";

const generateDynamicMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = -2; i < 14; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push(d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }));
    }
    return months;
};
const LIST_BULAN = generateDynamicMonths();

interface Invoice {
    id: string;
    student_id: string;
    bulan: string;
    nominal: number;
    status: 'Lunas' | 'Belum Bayar';
    tanggal_bayar?: string;
    created_at: string;
    due_date?: string;
    is_auto_generated?: boolean;
    bukti_url?: string;
    level_tagihan: string;
    students?: { nama: string; level: string; telepon?: string };
}

export default function PembayaranPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'Lunas' | 'Belum Bayar'>('all');
    const [wa_sending, setWaSending] = useState<string | null>(null);

    const initialForm = { student_id: "", bulan: LIST_BULAN[2], nominal: 1000000, status: "Belum Bayar" as const };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const { data: inv } = await supabase
            .from("invoices").select(`*, students(nama, level, telepon)`)
            .order("created_at", { ascending: false });
        const { data: std } = await supabase.from("students").select("id, nama, level");
        if (inv) setInvoices(inv);
        if (std) setStudents(std);
        setLoading(false);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.student_id) return alert("Pilih murid!");
        const student = students.find(s => s.id === formData.student_id);
        try {
            const { error } = await supabase.from("invoices").insert([{
                ...formData,
                level_tagihan: student?.level || "General",
            }]);
            if (error) throw error;
            setIsModalOpen(false);
            setFormData(initialForm);
        } catch (err: any) {
            console.error("Insert error:", err);
            alert("Gagal membuat tagihan:\n" + err.message);
        } finally {
            loadData();
        }
    }

    async function updateStatus(id: string, newStatus: 'Lunas' | 'Belum Bayar') {
        try {
            const { error } = await supabase.from("invoices").update({
                status: newStatus,
                tanggal_bayar: newStatus === "Lunas" ? new Date().toISOString().split('T')[0] : null
            }).eq("id", id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Update error:", err);
            alert("Gagal mengubah status:\n" + err.message);
        } finally {
            loadData();
        }
    }

    async function deleteInvoice(id: string) {
        if (!confirm("Hapus invoice ini?")) return;
        try {
            const { error } = await supabase.from("invoices").delete().eq("id", id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Gagal menghapus invoice:\n" + err.message);
        } finally {
            loadData();
        }
    }

    async function sendWA(inv: Invoice) {
        setWaSending(inv.id);
        try {
            const phone = inv.students?.telepon;
            if (!phone) { alert("Nomor WA murid tidak ada!"); return; }
            const res = await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    message: `📄 *Tagihan Kursus*\n\nTagihan bulan *${inv.bulan}* untuk *${inv.students?.nama}*:\n💰 *Rp ${inv.nominal.toLocaleString('id-ID')}*\n${inv.due_date ? `Jatuh tempo: *${inv.due_date}*` : ''}\n\nSilakan lakukan pembayaran. Terima kasih! 🙏\n\n_– Tim Mingxian_`
                }),
            });
            const data = await res.json();
            if (data.success) alert("WhatsApp berhasil dikirim!");
            else alert("Gagal kirim WA: " + data.error);
        } finally { setWaSending(null); }
    }

    const editFields = [
        { label: "Nominal (Rp)", name: "nominal", type: "number" as const },
        { label: "Status", name: "status", type: "select" as const, options: ["Belum Bayar", "Lunas"] },
        { label: "Periode", name: "bulan", type: "select" as const, options: LIST_BULAN },
        { label: "Jatuh Tempo", name: "due_date", type: "date" as const },
    ];

    async function handleUpdate(data: any) {
        const { error } = await supabase.from("invoices").update({
            nominal: data.nominal, status: data.status, bulan: data.bulan, due_date: data.due_date,
            tanggal_bayar: data.status === "Lunas" ? new Date().toISOString().split('T')[0] : null
        }).eq("id", data.id);

        if (error) throw error;
        loadData();
    }

    const filtered = invoices.filter(inv =>
        (filterStatus === 'all' || inv.status === filterStatus) &&
        (inv.students?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.bulan.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalLunas = invoices.filter(i => i.status === 'Lunas').reduce((a, i) => a + i.nominal, 0);
    const totalPending = invoices.filter(i => i.status === 'Belum Bayar').reduce((a, i) => a + i.nominal, 0);

    const availableStudents = useMemo(() =>
        students.filter(s => !invoices.some(i => i.student_id === s.id && i.bulan === formData.bulan)),
        [students, invoices, formData.bulan]
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                            <CreditCard size={22} />
                        </div>
                        Keuangan &amp; Tagihan
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Kelola invoice dan status pembayaran murid
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    <Plus size={18} /> Buat Tagihan
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                        <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terbayar</p>
                        <p style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--success)' }}>
                            Rp {(totalLunas / 1_000_000).toFixed(1)}jt
                        </p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
                        <AlertCircle size={24} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tunggakan</p>
                        <p style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--danger)' }}>
                            Rp {(totalPending / 1_000_000).toFixed(1)}jt
                        </p>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                        <CreditCard size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoice</p>
                        <p style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)' }}>{invoices.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input className="input-base pl-9" placeholder="Cari murid atau periode..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {(['all', 'Lunas', 'Belum Bayar'] as const).map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                                background: filterStatus === s ? 'var(--primary)' : 'var(--bg-secondary)',
                                color: filterStatus === s ? 'white' : 'var(--text-muted)',
                                border: '1.5px solid ' + (filterStatus === s ? 'var(--primary)' : 'var(--border)'),
                            }}>
                            {s === 'all' ? 'Semua' : s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)
                ) : filtered.length === 0 ? (
                    <div className="card p-10 text-center" style={{ color: 'var(--text-muted)' }}>Tidak ada data</div>
                ) : filtered.map(inv => (
                    <div key={inv.id} className="card p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                                style={{ background: 'var(--primary)' }}>
                                {(inv.students?.nama || '?')[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{inv.students?.nama}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.bulan}</p>
                            </div>
                            <span className={`badge ${inv.status === 'Lunas' ? 'badge-green' : 'badge-red'}`}>
                                {inv.status === 'Lunas' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                {inv.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Rp {inv.nominal.toLocaleString('id-ID')}</p>
                            <div className="flex items-center gap-1">
                                {inv.status === 'Belum Bayar' && (
                                    <button onClick={() => updateStatus(inv.id, 'Lunas')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold"
                                        style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                                        ✓ Lunas
                                    </button>
                                )}
                                <button onClick={() => sendWA(inv)} disabled={wa_sending === inv.id}
                                    className="p-2 rounded-xl" style={{ background: '#DCFCE7', color: '#25D366' }}>
                                    <Send size={14} />
                                </button>
                                <button onClick={() => { setSelectedInvoice(inv); setIsEditModalOpen(true); }}
                                    className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--info)' }}>
                                    <Pencil size={14} />
                                </button>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInvoice(inv.id); }}
                                    className="p-2 rounded-xl" style={{ background: '#FEF2F2', color: 'var(--danger)' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Murid</th>
                                <th>Periode</th>
                                <th>Nominal</th>
                                <th>Jatuh Tempo</th>
                                <th>Status</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j}><div className="h-5 skeleton rounded" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                            ) : filtered.map(inv => (
                                <tr key={inv.id} className="group">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                                style={{ background: 'var(--primary)' }}>
                                                {(inv.students?.nama || '?')[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700 }}>{inv.students?.nama}</p>
                                                {inv.is_auto_generated && (
                                                    <span className="badge badge-amber" style={{ fontSize: '0.6rem' }}><Sparkles size={9} /> Auto</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{inv.bulan}</td>
                                    <td style={{ fontWeight: 800 }}>Rp {inv.nominal.toLocaleString('id-ID')}</td>
                                    <td style={{ color: inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'Lunas' ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {inv.due_date || '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${inv.status === 'Lunas' ? 'badge-green' : 'badge-red'}`}>
                                            {inv.status === 'Lunas' ? <CheckCircle size={11} /> : <Clock size={11} />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {inv.status === 'Belum Bayar' ? (
                                                <button onClick={() => updateStatus(inv.id, 'Lunas')}
                                                    className="px-3 py-1 rounded-lg text-xs font-bold transition"
                                                    style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                                                    Konfirmasi
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{inv.tanggal_bayar}</span>
                                            )}
                                            <button onClick={() => sendWA(inv)} title="Kirim WhatsApp"
                                                className="p-1.5 rounded-lg transition" style={{ color: '#25D366' }}
                                                disabled={wa_sending === inv.id}>
                                                <Send size={16} />
                                            </button>
                                            <button onClick={() => { setSelectedInvoice(inv); setIsEditModalOpen(true); }}
                                                className="p-1.5 rounded-lg transition" style={{ color: 'var(--info)' }}>
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInvoice(inv.id); }}
                                                className="p-1.5 rounded-lg transition" style={{ color: 'var(--danger)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <ModalPortal>
                    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                        <div className="modal-content">
                            <div className="p-5 flex items-center justify-between" style={{ background: 'var(--primary)', color: 'white' }}>
                                <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Buat Invoice Baru
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                                    <X size={22} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <User size={12} className="inline mr-1" />Pilih Murid
                                    </label>
                                    <select required className="input-base"
                                        value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })}>
                                        <option value="">-- Pilih Murid --</option>
                                        {availableStudents.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.level})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <Calendar size={12} className="inline mr-1" />Periode
                                    </label>
                                    <select className="input-base"
                                        value={formData.bulan} onChange={e => setFormData({ ...formData, bulan: e.target.value })}>
                                        {LIST_BULAN.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        <DollarSign size={12} className="inline mr-1" />Nominal (Rp)
                                    </label>
                                    <input type="number" className="input-base"
                                        value={formData.nominal} onChange={e => setFormData({ ...formData, nominal: parseInt(e.target.value) })} />
                                </div>
                                <button type="submit" className="btn-primary w-full justify-center py-3">
                                    <Save size={18} /> Simpan Tagihan
                                </button>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            <EditModal
                title="Edit Invoice"
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdate}
                initialData={selectedInvoice}
                fields={editFields}
            />
        </div>
    );
}
