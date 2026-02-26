"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Users, Plus, Search, Trash2, X, Save, Eye, Edit3,
    FileSpreadsheet, Upload, Phone, Baby, MapPin, Mail,
    CheckSquare, Square, Trash, FileText
} from "lucide-react";
import Papa from "papaparse";

interface Student {
    id: string; nama: string; panggilan?: string; email?: string;
    telepon?: string; level?: string; alamat?: string;
    catatan?: string; usia?: string; tanggal_daftar?: string;
}

export default function MuridPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

    const [formData, setFormData] = useState({
        nama: "", email: "", telepon: "", level: "General",
        alamat: "", catatan: "", usia: "", panggilan: ""
    });

    useEffect(() => { fetchStudents(); }, []);

    const toTitleCase = (str: string) =>
        str ? str.toLowerCase().replace(/(?:^|\s)\w/g, m => m.toUpperCase()) : "";

    async function fetchStudents() {
        setLoading(true);
        const { data } = await supabase.from("students").select("*").order("nama");
        if (data) setStudents(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Hapus murid ini?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('students').delete().eq('id', id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Gagal menghapus murid:\n" + err.message);
        } finally {
            fetchStudents();
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const payload = { ...formData };
        try {
            if (editingStudent) {
                const { error } = await supabase.from("students").update(payload).eq("id", editingStudent.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("students").insert([{ ...payload, tanggal_daftar: new Date().toISOString().split('T')[0] }]);
                if (error) throw error;
            }
            closeModal();
        } catch (err: any) {
            console.error("Save error:", err);
            alert("Gagal menyimpan data:\n" + err.message);
        } finally {
            fetchStudents();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false); setEditingStudent(null);
        setFormData({ nama: "", panggilan: "", email: "", telepon: "", level: "General", alamat: "", catatan: "", usia: "" });
    };

    const handleExportCSV = () => {
        const csv = Papa.unparse(students.map(s => ({
            Nama: s.nama, Panggilan: s.panggilan || "", Email: s.email || "",
            Telepon: s.telepon || "", Level: s.level || "",
            "Tanggal Daftar": s.tanggal_daftar || "", Alamat: s.alamat || "", Usia: s.usia || "",
        })));
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `data_murid_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.size} murid?`)) return;
        setLoading(true);
        try {
            const { error } = await supabase.from("students").delete().in("id", Array.from(selectedIds));
            if (error) throw error;
            setSelectedIds(new Set());
        } catch (err: any) {
            console.error("Bulk delete error:", err);
            alert("Gagal menghapus murid:\n" + err.message);
        } finally {
            fetchStudents();
        }
    };

    const filtered = students.filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.telepon || '').includes(searchTerm)
    );

    const LEVELS = ["General", "Montessori", "Business", "HSK", "Private", "Trial"];

    const levelColor: Record<string, string> = {
        General: '#F59E0B', Montessori: '#8B5CF6', Business: '#3B82F6',
        HSK: '#10B981', Private: '#EC4899', Trial: '#6B7280',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#10B981' }}>
                            <Users size={22} />
                        </div>
                        Database Murid
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {students.length} murid terdaftar
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <label className="btn-ghost cursor-pointer">
                        <Upload size={16} /> Import CSV
                        <input type="file" accept=".csv" className="hidden"
                            onChange={e => {
                                const file = e.target.files?.[0]; if (!file) return;
                                const reader = new FileReader();
                                reader.onload = ev => {
                                    Papa.parse(ev.target?.result as string, {
                                        header: true, skipEmptyLines: true,
                                        complete: async ({ data }: any) => {
                                            const rows = data.map((r: any) => ({
                                                nama: toTitleCase(r.Nama || r.nama || ''),
                                                email: r.Email || r.email || '',
                                                telepon: r.Telepon || r.telepon || '',
                                                level: r.Level || r.level || 'General',
                                                alamat: r.Alamat || r.alamat || '',
                                                usia: r.Usia || r.usia || '',
                                                tanggal_daftar: new Date().toISOString().split('T')[0],
                                            })).filter((r: any) => r.nama);
                                            if (rows.length === 0) return alert('Format tidak dikenali');
                                            await supabase.from('students').upsert(rows, { onConflict: 'nama' });
                                            alert(`${rows.length} murid berhasil diimpor`);
                                            fetchStudents();
                                        }
                                    });
                                };
                                reader.readAsText(file); e.target.value = '';
                            }} />
                    </label>
                    <button onClick={handleExportCSV} className="btn-ghost">
                        <FileSpreadsheet size={16} /> Export
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        <Plus size={18} /> Tambah Murid
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input className="input-base pl-9" placeholder="Cari nama atau nomor WA..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {selectedIds.size > 0 && (
                    <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #FCA5A5' }}>
                        <Trash size={15} /> Hapus ({selectedIds.size})
                    </button>
                )}
            </div>

            {/* Mobile Card List (hidden on md+) */}
            <div className="md:hidden space-y-2">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)
                ) : filtered.length === 0 ? (
                    <div className="card p-10 text-center" style={{ color: 'var(--text-muted)' }}>Tidak ada data</div>
                ) : filtered.map((s) => (
                    <div key={s.id} className="card p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                            style={{ background: levelColor[s.level || 'General'] || '#F59E0B' }}>
                            {s.nama[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{s.nama}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="badge text-[10px]" style={{
                                    background: (levelColor[s.level || ''] || '#F59E0B') + '20',
                                    color: levelColor[s.level || ''] || '#F59E0B'
                                }}>{s.level || 'General'}</span>
                                {s.telepon && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Phone size={11} />{s.telepon}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setViewingStudent(s)} className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--info)' }}><Eye size={15} /></button>
                            <button onClick={() => {
                                setEditingStudent(s);
                                setFormData({ nama: s.nama, panggilan: s.panggilan || '', email: s.email || '', telepon: s.telepon || '', level: s.level || 'General', alamat: s.alamat || '', catatan: s.catatan || '', usia: s.usia || '' });
                                setIsModalOpen(true);
                            }} className="p-2 rounded-xl" style={{ background: 'var(--bg-secondary)', color: 'var(--primary-dark)' }}><Edit3 size={15} /></button>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(s.id); }}
                                className="p-2 rounded-xl" style={{ background: '#FEF2F2', color: 'var(--danger)' }}><Trash2 size={15} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden md:block card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th className="w-10">
                                    <button onClick={() => setSelectedIds(
                                        selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(s => s.id))
                                    )}>
                                        {selectedIds.size === filtered.length && filtered.length > 0
                                            ? <CheckSquare size={16} style={{ color: 'var(--primary)' }} />
                                            : <Square size={16} style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                </th>
                                <th className="w-10">No</th>
                                <th>Nama Murid</th>
                                <th>Kontak</th>
                                <th>Level</th>
                                <th>Daftar</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="h-5 skeleton rounded" /></td>)}</tr>
                                ))
                            ) : filtered.map((s, idx) => (
                                <tr key={s.id} className="group">
                                    <td>
                                        <button onClick={() => {
                                            const n = new Set(selectedIds);
                                            n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                                            setSelectedIds(n);
                                        }}>
                                            {selectedIds.has(s.id)
                                                ? <CheckSquare size={16} style={{ color: 'var(--primary)' }} />
                                                : <Square size={16} style={{ color: 'var(--text-muted)' }} />}
                                        </button>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                                                style={{ background: levelColor[s.level || 'General'] || '#F59E0B' }}>
                                                {s.nama[0]}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700 }}>{s.nama}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {s.panggilan && `(${s.panggilan}) · `}
                                                    <Baby size={10} className="inline" /> {s.usia || '—'} thn
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        <div className="flex items-center gap-1"><Phone size={13} /> {s.telepon || '—'}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: (levelColor[s.level || ''] || '#F59E0B') + '20',
                                            color: levelColor[s.level || ''] || '#F59E0B'
                                        }}>
                                            {s.level || 'General'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.tanggal_daftar || '—'}</td>
                                    <td>
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewingStudent(s)} title="Lihat Detail"
                                                className="p-1.5 rounded-lg" style={{ color: 'var(--info)' }}>
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => {
                                                setEditingStudent(s);
                                                setFormData({
                                                    nama: s.nama, panggilan: s.panggilan || '', email: s.email || '',
                                                    telepon: s.telepon || '', level: s.level || 'General', alamat: s.alamat || '',
                                                    catatan: s.catatan || '', usia: s.usia || ''
                                                });
                                                setIsModalOpen(true);
                                            }} className="p-1.5 rounded-lg" style={{ color: 'var(--primary-dark)' }}>
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(s.id); }}
                                                className="p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}>
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

            {/* Form Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-content max-h-[90vh] overflow-y-auto">
                        <div className="p-5 flex items-center justify-between" style={{ background: 'var(--primary)', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                {editingStudent ? 'Edit Murid' : 'Tambah Murid Baru'}
                            </h2>
                            <button onClick={closeModal} className="hover:rotate-90 transition-transform"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Nama Lengkap', key: 'nama', required: true },
                                { label: 'Nama Panggilan', key: 'panggilan' },
                                { label: 'WhatsApp', key: 'telepon' },
                                { label: 'Usia (Tahun)', key: 'usia', type: 'number' },
                            ].map(f => (
                                <div key={f.key} className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                        {f.label}
                                    </label>
                                    <input required={f.required} type={f.type || 'text'} className="input-base"
                                        value={(formData as any)[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                                </div>
                            ))}
                            <div className="col-span-2 space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</label>
                                <select className="input-base" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Alamat</label>
                                <textarea className="input-base" rows={2}
                                    value={formData.alamat} onChange={e => setFormData({ ...formData, alamat: e.target.value })} />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catatan</label>
                                <textarea className="input-base" rows={2}
                                    value={formData.catatan} onChange={e => setFormData({ ...formData, catatan: e.target.value })} />
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="btn-ghost">Batal</button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    <Save size={16} /> {loading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {viewingStudent && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setViewingStudent(null)}>
                    <div className="modal-content max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-5 flex items-center justify-between" style={{ background: 'var(--primary)', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Profil Lengkap</h2>
                            <button onClick={() => setViewingStudent(null)} className="hover:rotate-90 transition-transform"><X size={22} /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                                    style={{ background: levelColor[viewingStudent.level || ''] || 'var(--primary)' }}>
                                    {viewingStudent.nama[0]}
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{viewingStudent.nama}</h2>
                                    <span className="badge" style={{
                                        background: (levelColor[viewingStudent.level || ''] || '#F59E0B') + '20',
                                        color: levelColor[viewingStudent.level || ''] || '#F59E0B',
                                    }}>{viewingStudent.level}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'WhatsApp', val: viewingStudent.telepon, icon: <Phone size={14} /> },
                                    { label: 'Email', val: viewingStudent.email, icon: <Mail size={14} /> },
                                    { label: 'Usia', val: viewingStudent.usia ? `${viewingStudent.usia} Tahun` : undefined, icon: <Baby size={14} /> },
                                    { label: 'Tanggal Daftar', val: viewingStudent.tanggal_daftar, icon: null },
                                    { label: 'Alamat', val: viewingStudent.alamat, icon: <MapPin size={14} />, span2: true },
                                ].map(row => row.val ? (
                                    <div key={row.label} className={row.span2 ? 'col-span-2' : ''}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {row.label}
                                        </label>
                                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {row.icon}{row.val}
                                        </p>
                                    </div>
                                ) : null)}
                                {viewingStudent.catatan && (
                                    <div className="col-span-2">
                                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catatan</label>
                                        <div className="mt-1 p-3 rounded-xl text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                                            {viewingStudent.catatan}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
