"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EditModal from "@/app/components/EditModal";
import { GraduationCap, Plus, Trash2, Clock, X, Save, Pencil, Phone } from "lucide-react";

export default function PengajarPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

    const [nama, setNama] = useState("");
    const [level, setLevel] = useState("Pemula");
    const [jamMulai, setJamMulai] = useState("08:00");
    const [jamSelesai, setJamSelesai] = useState("16:00");
    const [hariTerpilih, setHariTerpilih] = useState<string[]>([]);
    const [alias, setAlias] = useState("");
    const [telepon, setTelepon] = useState("");

    const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    useEffect(() => { fetchTeachers(); }, []);

    async function fetchTeachers() {
        const { data } = await supabase.from("teachers").select("*").order("created_at", { ascending: false });
        if (data) setTeachers(data);
    }

    const editFields = [
        { label: "Nama Lengkap", name: "nama", type: "text" as const },
        { label: "Telepon/WA", name: "telepon", type: "text" as const },
        { label: "Level Mengajar", name: "level", type: "select" as const, options: ["Pemula", "Menengah", "Lanjut", "Semua Level"] },
        { label: "Jam Mulai", name: "jam_mulai", type: "time" as const },
        { label: "Jam Selesai", name: "jam_selesai", type: "time" as const },
        { label: "Hari Kerja", name: "hari_kerja", type: "days" as const },
        { label: "Alias (pisahkan koma)", name: "alias", type: "text" as const },
    ];

    async function handleSimpan(e: React.FormEvent) {
        e.preventDefault();
        if (hariTerpilih.length === 0) return alert("Pilih minimal satu hari kerja!");
        const aliasArr = alias.split(",").map(a => a.trim()).filter(Boolean);
        try {
            const { error } = await supabase.from("teachers").insert([{
                nama, level, telepon, jam_mulai: jamMulai, jam_selesai: jamSelesai,
                hari_kerja: hariTerpilih, alias: aliasArr,
            }]);
            if (error) throw error;
            setIsModalOpen(false);
            resetForm();
        } catch (err: any) {
            console.error("Insert error:", err);
            alert("Gagal menambahkan pengajar:\n" + err.message);
        } finally {
            fetchTeachers();
        }
    }

    async function handleUpdate(data: any) {
        const aliasArr = typeof data.alias === 'string'
            ? data.alias.split(",").map((a: string) => a.trim()).filter(Boolean) : data.alias;

        const { error } = await supabase.from("teachers").update({
            nama: data.nama, telepon: data.telepon, level: data.level,
            jam_mulai: data.jam_mulai, jam_selesai: data.jam_selesai,
            hari_kerja: data.hari_kerja, alias: aliasArr,
        }).eq("id", data.id);

        if (error) throw error;
        fetchTeachers();
    }

    async function handleDelete(id: string) {
        if (!confirm("Hapus pengajar?")) return;
        try {
            const { error } = await supabase.from("teachers").delete().eq("id", id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Gagal menghapus pengajar:\n" + err.message);
        } finally {
            fetchTeachers();
        }
    }

    function resetForm() {
        setNama(""); setLevel("Pemula"); setJamMulai("08:00");
        setJamSelesai("16:00"); setHariTerpilih([]); setAlias(""); setTelepon("");
    }

    const levelBg: Record<string, string> = {
        Pemula: '#DBEAFE', Menengah: '#D1FAE5', Lanjut: '#FEE2E2', 'Semua Level': '#EDE9FE'
    };
    const levelTxt: Record<string, string> = {
        Pemula: '#1D4ED8', Menengah: '#059669', Lanjut: '#DC2626', 'Semua Level': '#7C3AED'
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#3B82F6' }}>
                            <GraduationCap size={22} />
                        </div>
                        Data Pengajar
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {teachers.length} pengajar terdaftar
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary self-start">
                    <Plus size={18} /> Tambah Pengajar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 h-48 skeleton" />)
                ) : teachers.map(t => (
                    <div key={t.id} className="card p-6 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black"
                                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                                    {t.nama[0]}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{t.nama}</h3>
                                    <span className="badge" style={{ background: levelBg[t.level] || '#FEF3C7', color: levelTxt[t.level] || '#92400E' }}>
                                        {t.level}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setSelectedTeacher({ ...t, alias: t.alias?.join(", ") || "" }); setIsEditModalOpen(true); }}
                                    className="p-1.5 rounded-lg" style={{ color: 'var(--info)' }}><Pencil size={15} /></button>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(t.id); }}
                                    className="p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={14} />
                                <span>{t.jam_mulai?.slice(0, 5)} — {t.jam_selesai?.slice(0, 5)}</span>
                            </div>
                            {t.telepon && (
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                                    <Phone size={14} /> {t.telepon}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {t.hari_kerja?.map((h: string) => (
                                    <span key={h} className="badge badge-amber" style={{ fontSize: '0.65rem' }}>{h}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && (setIsModalOpen(false), resetForm())}>
                    <div className="modal-content max-h-[90vh] overflow-y-auto">
                        <div className="p-5 flex items-center justify-between" style={{ background: '#3B82F6', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Tambah Pengajar</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSimpan} className="p-6 space-y-4">
                            {[
                                { label: 'Nama Lengkap', val: nama, set: setNama, required: true },
                                { label: 'Telepon/WA', val: telepon, set: setTelepon },
                                { label: 'Alias', val: alias, set: setAlias, placeholder: 'Pisahkan koma...' },
                            ].map(f => (
                                <div key={f.label} className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{f.label}</label>
                                    <input required={f.required} className="input-base" placeholder={f.placeholder}
                                        value={f.val} onChange={e => f.set(e.target.value)} />
                                </div>
                            ))}
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</label>
                                <select className="input-base" value={level} onChange={e => setLevel(e.target.value)}>
                                    {['Pemula', 'Menengah', 'Lanjut', 'Semua Level'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Mulai</label>
                                    <input type="time" className="input-base" value={jamMulai} onChange={e => setJamMulai(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Selesai</label>
                                    <input type="time" className="input-base" value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hari Kerja</label>
                                <div className="flex flex-wrap gap-2">
                                    {HARI.map(h => (
                                        <button key={h} type="button"
                                            onClick={() => setHariTerpilih(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                                            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                            style={{
                                                background: hariTerpilih.includes(h) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                color: hariTerpilih.includes(h) ? 'white' : 'var(--text-muted)',
                                                borderColor: hariTerpilih.includes(h) ? 'var(--primary)' : 'var(--border)',
                                            }}>
                                            {h}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="btn-primary w-full justify-center">
                                <Save size={18} /> Simpan Pengajar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <EditModal
                title="Edit Pengajar"
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdate}
                initialData={selectedTeacher}
                fields={editFields}
            />
        </div>
    );
}
