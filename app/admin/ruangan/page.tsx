"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EditModal from "@/app/components/EditModal";
import { Home, Plus, Trash2, X, Save, Pencil, Users, CheckCircle, AlertTriangle, Settings } from "lucide-react";

export default function RuanganPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);

    const [formData, setFormData] = useState({
        nama_ruangan: "", kapasitas: 6, status: "Tersedia", catatan_fasilitas: ""
    });

    useEffect(() => { fetchRooms(); }, []);

    async function fetchRooms() {
        const { data } = await supabase.from("rooms").select("*").order("nama_ruangan");
        if (data) setRooms(data);
        setLoading(false);
    }

    async function handleSimpan(e: React.FormEvent) {
        e.preventDefault();
        try {
            const { error } = await supabase.from("rooms").insert([formData]);
            if (error) throw error;
            setIsModalOpen(false);
            setFormData({ nama_ruangan: "", kapasitas: 6, status: "Tersedia", catatan_fasilitas: "" });
        } catch (err: any) {
            console.error("Insert error:", err);
            alert("Gagal menambahkan ruangan:\n" + err.message);
        } finally {
            fetchRooms();
        }
    }

    const editFields = [
        { label: "Nama Ruangan", name: "nama_ruangan", type: "text" as const },
        { label: "Kapasitas", name: "kapasitas", type: "number" as const },
        { label: "Status", name: "status", type: "select" as const, options: ["Tersedia", "Terpakai", "Maintenance"] },
        { label: "Catatan Fasilitas", name: "catatan_fasilitas", type: "textarea" as const },
    ];

    async function handleUpdate(data: any) {
        const { error } = await supabase.from("rooms").update({
            nama_ruangan: data.nama_ruangan, kapasitas: data.kapasitas,
            status: data.status, catatan_fasilitas: data.catatan_fasilitas,
        }).eq("id", data.id);

        if (error) throw error;
        fetchRooms();
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Hapus ${name}?`)) return;
        try {
            const { error } = await supabase.from("rooms").delete().eq("id", id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Delete error:", err);
            alert("Gagal menghapus ruangan:\n" + err.message);
        } finally {
            fetchRooms();
        }
    }

    const statusInfo: Record<string, { icon: typeof CheckCircle, bg: string, color: string }> = {
        Tersedia: { icon: CheckCircle, bg: '#ECFDF5', color: '#16A34A' },
        Terpakai: { icon: AlertTriangle, bg: '#FFF7ED', color: '#D97706' },
        Maintenance: { icon: Settings, bg: '#FEF2F2', color: '#DC2626' },
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#10B981' }}>
                            <Home size={22} />
                        </div>
                        Manajemen Ruangan
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {rooms.filter(r => r.status === 'Tersedia').length} tersedia dari {rooms.length} ruangan
                    </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary self-start">
                    <Plus size={18} /> Tambah Ruangan
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-6 h-48 skeleton" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {rooms.map(room => {
                        const info = statusInfo[room.status] || statusInfo.Tersedia;
                        return (
                            <div key={room.id} className="card p-6 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                        style={{ background: info.bg }}>
                                        <info.icon size={24} style={{ color: info.color }} />
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setSelectedRoom(room); setIsEditModalOpen(true); }}
                                            className="p-1.5 rounded-lg" style={{ color: 'var(--info)' }}><Pencil size={15} /></button>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(room.id, room.nama_ruangan); }}
                                            className="p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                    </div>
                                </div>

                                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    {room.nama_ruangan}
                                </h3>

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="badge" style={{ background: info.bg, color: info.color }}>
                                        {room.status}
                                    </span>
                                    <span className="badge badge-gray">
                                        <Users size={11} /> {room.kapasitas} kursi
                                    </span>
                                </div>

                                {room.catatan_fasilitas && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}
                                        className="italic">{room.catatan_fasilitas}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="modal-content">
                        <div className="p-5 flex items-center justify-between" style={{ background: '#10B981', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Tambah Ruangan</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSimpan} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Ruangan</label>
                                <input required className="input-base" placeholder="Contoh: Ruang Montessori 1"
                                    onChange={e => setFormData({ ...formData, nama_ruangan: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kapasitas</label>
                                    <input type="number" className="input-base" defaultValue={6}
                                        onChange={e => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                                    <select className="input-base" onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option>Tersedia</option><option>Terpakai</option><option>Maintenance</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catatan Fasilitas</label>
                                <textarea className="input-base" rows={3} placeholder="AC, Proyektor, Karpet..."
                                    onChange={e => setFormData({ ...formData, catatan_fasilitas: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary w-full justify-center">
                                <Save size={18} /> Simpan Ruangan
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <EditModal title="Edit Ruangan" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdate} initialData={selectedRoom} fields={editFields} />
        </div>
    );
}
