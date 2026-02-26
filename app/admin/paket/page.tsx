"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Plus, X, Save, Trash2, Pencil, CheckCircle, AlertCircle } from "lucide-react";
import ModalPortal from "@/app/components/ModalPortal";

export default function PaketPage() {
    const [pakets, setPakets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formError, setFormError] = useState('');

    const [form, setForm] = useState({
        nama: '', harga: 1000000, jumlah_sesi: 8, deskripsi: '', is_active: true,
    });

    useEffect(() => { fetchPakets(); }, []);

    async function fetchPakets() {
        const { data } = await supabase.from('paket_kursus').select('*').order('harga');
        if (data) setPakets(data);
        setLoading(false);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setFormError('');
        if (!form.nama.trim()) { setFormError('Nama paket tidak boleh kosong.'); return; }
        if (!form.harga || form.harga <= 0) { setFormError('Harga harus lebih dari 0.'); return; }
        if (!form.jumlah_sesi || form.jumlah_sesi <= 0) { setFormError('Jumlah sesi harus lebih dari 0.'); return; }

        if (editing) {
            await supabase.from('paket_kursus').update(form).eq('id', editing.id);
        } else {
            await supabase.from('paket_kursus').insert([form]);
        }
        closeModal();
        fetchPakets();
    }

    function closeModal() {
        setShowModal(false);
        setEditing(null);
        setFormError('');
        setForm({ nama: '', harga: 500000, jumlah_sesi: 8, deskripsi: '', is_active: true });
    }

    const openEdit = (p: any) => {
        setEditing(p);
        setFormError('');
        setForm({ nama: p.nama, harga: p.harga, jumlah_sesi: p.jumlah_sesi, deskripsi: p.deskripsi || '', is_active: p.is_active });
        setShowModal(true);
    };

    const gradients = [
        'linear-gradient(135deg, #FEF3C7, #FDE68A)',
        'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
        'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
        'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
        'linear-gradient(135deg, #FFE4E6, #FECDD3)',
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#F97316' }}>
                            <Package size={22} />
                        </div>
                        Paket Kursus
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Kelola paket kursus dan harga yang tersedia
                    </p>
                </div>
                <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary self-start">
                    <Plus size={18} /> Tambah Paket
                </button>
            </div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 h-48 skeleton" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {pakets.map((p, idx) => (
                        <div key={p.id} className="card p-6 relative overflow-hidden hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30 -mr-8 -mt-8"
                                style={{ background: gradients[idx % gradients.length] }} />
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{p.nama}</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {p.jumlah_sesi} sesi/bulan
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: 'var(--info)' }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={async () => {
                                            if (confirm('Hapus paket?')) {
                                                await supabase.from('paket_kursus').delete().eq('id', p.id);
                                                fetchPakets();
                                            }
                                        }} className="p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--primary-dark)' }}>
                                    Rp {p.harga.toLocaleString('id-ID')}
                                </p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>/bulan</p>
                                {p.deskripsi && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                                        {p.deskripsi}
                                    </p>
                                )}
                                <div className="mt-4">
                                    <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>
                                        {p.is_active ? <><CheckCircle size={11} /> Aktif</> : 'Nonaktif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal via Portal — renders at document.body, escapes AppShell overflow stacking context ── */}
            {showModal && (
                <ModalPortal>
                    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
                        <div className="modal-content">
                            {/* Header */}
                            <div className="p-5 flex items-center justify-between shrink-0"
                                style={{ background: '#F97316', color: 'white' }}>
                                <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                    {editing ? 'Edit Paket' : 'Tambah Paket Baru'}
                                </h2>
                                <button onClick={closeModal} className="hover:rotate-90 transition-transform">
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Scrollable form body */}
                            <form onSubmit={handleSave} noValidate className="p-6 space-y-4 overflow-y-auto">

                                {/* Inline validation error */}
                                {formError && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl"
                                        style={{ background: 'var(--danger-bg)', border: '1px solid #FCA5A5' }}>
                                        <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                                        <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                                            {formError}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label style={{
                                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                        color: formError && !form.nama.trim() ? 'var(--danger)' : 'var(--text-muted)',
                                    }}>
                                        Nama Paket *
                                    </label>
                                    <input
                                        className="input-base"
                                        placeholder="Contoh: Paket General 8x"
                                        value={form.nama}
                                        onChange={e => { setForm({ ...form, nama: e.target.value }); setFormError(''); }}
                                        style={{
                                            borderColor: formError && !form.nama.trim() ? 'var(--danger)' : undefined,
                                            boxShadow: formError && !form.nama.trim() ? '0 0 0 3px rgba(220,38,38,0.1)' : undefined,
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Harga (Rp)
                                        </label>
                                        <input type="number" min={0} className="input-base" value={form.harga}
                                            onChange={e => setForm({ ...form, harga: parseInt(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Jumlah Sesi
                                        </label>
                                        <input type="number" min={1} className="input-base" value={form.jumlah_sesi}
                                            onChange={e => setForm({ ...form, jumlah_sesi: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        Deskripsi
                                    </label>
                                    <textarea className="input-base" rows={3} value={form.deskripsi}
                                        onChange={e => setForm({ ...form, deskripsi: e.target.value })} />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="is_active_paket" checked={form.is_active}
                                        onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                                    <label htmlFor="is_active_paket" style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                                        Paket Aktif
                                    </label>
                                </div>

                                <button type="submit" className="btn-primary w-full justify-center py-3">
                                    <Save size={16} /> Simpan Paket
                                </button>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}
