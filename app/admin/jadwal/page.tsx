"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Plus, Trash2, X, Save, ChevronLeft, ChevronRight, Clock, User, Home, Search } from "lucide-react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';

interface Session {
    id: string; nama_kelas: string; jenis_kelas?: string;
    teacher_id?: string; room_id?: string; hari: string;
    jam_mulai: string; jam_selesai: string;
    teachers?: { nama: string }; rooms?: { nama_ruangan: string };
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00

const JENIS = ['General', 'Montessori', 'Business', 'HSK', 'Private', 'Trial'];
const jenisColor: Record<string, string> = {
    General: '#F59E0B', Montessori: '#8B5CF6', Business: '#3B82F6',
    HSK: '#10B981', Private: '#EC4899', Trial: '#6B7280',
};
const hariToInt: Record<string, number> = { Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };

export default function JadwalPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'week' | 'list'>('week');
    const [search, setSearch] = useState('');
    const [filterRoom, setFilterRoom] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);

    const [form, setForm] = useState({
        nama_kelas: '', jenis_kelas: 'General', teacher_id: '',
        room_id: '', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '09:00',
    });

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        const [{ data: s }, { data: t }, { data: r }, { data: st }] = await Promise.all([
            supabase.from('sessions').select('*, teachers(nama), rooms(nama_ruangan)').order('hari').order('jam_mulai'),
            supabase.from('teachers').select('id, nama'),
            supabase.from('rooms').select('id, nama_ruangan'),
            supabase.from('students').select('id, nama'),
        ]);
        if (s) setSessions(s);
        if (t) setTeachers(t);
        if (r) setRooms(r);
        if (st) setStudents(st);
        setLoading(false);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            await supabase.from('sessions').update(form).eq('id', editing.id);
        } else {
            await supabase.from('sessions').insert([form]);
        }
        setShowModal(false); setEditing(null);
        setForm({ nama_kelas: '', jenis_kelas: 'General', teacher_id: '', room_id: '', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '09:00' });
        fetchAll();
    }

    async function handleDelete(id: string) {
        if (confirm('Hapus jadwal ini?')) {
            await supabase.from('sessions').delete().eq('id', id);
            fetchAll();
        }
    }

    const openEdit = (s: Session) => {
        setEditing(s);
        setForm({
            nama_kelas: s.nama_kelas, jenis_kelas: s.jenis_kelas || 'General',
            teacher_id: s.teacher_id || '', room_id: s.room_id || '',
            hari: s.hari, jam_mulai: s.jam_mulai.slice(0, 5), jam_selesai: s.jam_selesai.slice(0, 5),
        });
        setShowModal(true);
    };

    const filtered = sessions.filter(s => {
        const matchesSearch = !search ||
            s.nama_kelas.toLowerCase().includes(search.toLowerCase()) ||
            s.teachers?.nama?.toLowerCase().includes(search.toLowerCase());
        const matchesRoom = !filterRoom || s.room_id === filterRoom;
        const matchesTeacher = !filterTeacher || s.teacher_id === filterTeacher;
        return matchesSearch && matchesRoom && matchesTeacher;
    });

    const calendarEvents = filtered.map(s => ({
        id: s.id,
        title: s.nama_kelas,
        daysOfWeek: [hariToInt[s.hari]],
        startTime: s.jam_mulai,
        endTime: s.jam_selesai,
        backgroundColor: (jenisColor[s.jenis_kelas || 'General'] || '#F59E0B'),
        borderColor: 'transparent',
        extendedProps: { ...s }
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#8B5CF6' }}>
                            <Calendar size={22} />
                        </div>
                        Jadwal Kelas
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {sessions.length} sesi aktif
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                        {(['week', 'list'] as const).map(v => (
                            <button key={v} onClick={() => setView(v)}
                                className="px-4 py-2 text-sm font-bold transition-all capitalize"
                                style={{
                                    background: view === v ? 'var(--primary)' : 'white',
                                    color: view === v ? 'white' : 'var(--text-muted)',
                                }}>
                                {v === 'week' ? 'Kalender' : 'Daftar'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
                        <Plus size={18} /> Tambah Jadwal
                    </button>
                </div>
            </div>

            {/* Filters & Legend */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center p-4 rounded-xl bg-white shadow-sm" style={{ border: '1px solid var(--border)' }}>
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input className="input-base pl-9 w-full bg-slate-50 border-transparent focus:border-amber-400 focus:bg-white" placeholder="Cari kelas..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <select className="input-base w-auto bg-slate-50 border-transparent focus:border-amber-400 focus:bg-white" value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
                        <option value="">Semua Ruangan</option>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.nama_ruangan}</option>)}
                    </select>
                    <select className="input-base w-auto bg-slate-50 border-transparent focus:border-amber-400 focus:bg-white" value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                        <option value="">Semua Pengajar</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-3 pt-3 lg:pt-0 w-full lg:w-auto lg:border-l lg:pl-4" style={{ borderColor: 'var(--border-light)' }}>
                    {JENIS.map(j => (
                        <div key={j} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: jenisColor[j] }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{j}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── CALENDAR VIEW ── */}
            {view === 'week' && (
                <div className="card p-4 overflow-hidden shadow-sm" style={{ border: '1px solid var(--border)' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .fc { --fc-button-bg-color: var(--primary); --fc-button-border-color: var(--primary); --fc-button-hover-bg-color: #7C3AED; --fc-button-hover-border-color: #7C3AED; --fc-button-active-bg-color: #6D28D9; --fc-today-bg-color: #F8FAFC; }
                        .fc-toolbar-title { font-weight: 800 !important; font-size: 1.2rem !important; color: var(--text-primary); text-transform: capitalize; }
                        .fc-button { font-weight: 700 !important; text-transform: capitalize !important; border-radius: 8px !important; padding: 6px 12px !important; }
                        .fc-event { cursor: pointer; border-radius: 6px; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s, opacity 0.2s, z-index 0s; padding: 2px; }
                        .fc-event:hover { transform: scale(1.02); z-index: 50 !important; opacity: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                        .fc-timegrid-slot-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
                        .fc-col-header-cell-cushion { font-weight: 800; color: var(--text-primary); padding: 10px; font-size: 0.85rem;}
                        .fc-timegrid-event .fc-event-main { padding: 4px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
                        .fc-timegrid-event-short .fc-event-main { flex-direction: row; gap: 4px; align-items: center; }
                        .fc-list-event-time { color: var(--text-muted); font-weight: 600; }
                        .fc-list-event-title { font-weight: 700; color: var(--text-primary); }
                    `}} />
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        locales={[idLocale]}
                        locale="id"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                        }}
                        events={calendarEvents}
                        slotMinTime="07:00:00"
                        slotMaxTime="20:00:00"
                        allDaySlot={false}
                        height="auto"
                        contentHeight={800}
                        slotEventOverlap={false}
                        eventMinHeight={22}
                        expandRows={true}
                        stickyHeaderDates={true}
                        eventClick={(info) => {
                            const s = info.event.extendedProps as Session;
                            openEdit(s);
                        }}
                        eventContent={(arg) => {
                            if (arg.view.type === 'dayGridMonth') {
                                return (
                                    <div className="leading-none text-[0.65rem] text-white overflow-hidden px-1">
                                        <b className="truncate">{arg.timeText}</b> <span className="truncate">{arg.event.title}</span>
                                    </div>
                                );
                            }

                            const s = arg.event.extendedProps as Session;
                            return (
                                <div className="leading-tight w-full h-full overflow-hidden text-xs text-white">
                                    <div className="font-bold mb-0.5">{arg.event.title}</div>
                                    <div className="opacity-90">{arg.timeText}</div>
                                    {s.teachers?.nama && <div className="opacity-80 mt-1 truncate">{s.teachers.nama}</div>}
                                    {s.rooms?.nama_ruangan && <div className="opacity-80 truncate">{s.rooms.nama_ruangan}</div>}
                                </div>
                            );
                        }}
                    />
                </div>
            )}

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
                <div className="card overflow-hidden">
                    <table className="table-base">
                        <thead>
                            <tr>
                                <th>Nama Kelas</th>
                                <th>Hari</th>
                                <th>Jam</th>
                                <th>Pengajar</th>
                                <th>Ruangan</th>
                                <th>Jenis</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j}><div className="h-5 skeleton rounded" /></td>)}</tr>
                                ))
                            ) : filtered.map(s => (
                                <tr key={s.id} className="group">
                                    <td style={{ fontWeight: 700 }}>{s.nama_kelas}</td>
                                    <td>{s.hari}</td>
                                    <td>
                                        <div className="flex items-center gap-1" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Clock size={13} /> {s.jam_mulai.slice(0, 5)} - {s.jam_selesai.slice(0, 5)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                            <User size={13} style={{ color: 'var(--text-muted)' }} />
                                            {s.teachers?.nama || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1" style={{ fontSize: '0.8rem' }}>
                                            <Home size={13} style={{ color: 'var(--text-muted)' }} />
                                            {s.rooms?.nama_ruangan || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: (jenisColor[s.jenis_kelas || 'General'] || '#F59E0B') + '20',
                                            color: jenisColor[s.jenis_kelas || 'General'] || '#F59E0B',
                                        }}>{s.jenis_kelas || 'General'}</span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg" style={{ color: 'var(--info)' }}>
                                                <Clock size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg" style={{ color: 'var(--danger)' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content max-h-[90vh] overflow-y-auto max-w-lg">
                        <div className="p-5 flex items-center justify-between" style={{ background: '#8B5CF6', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                {editing ? 'Edit Jadwal' : 'Tambah Jadwal'}
                            </h2>
                            <button onClick={() => setShowModal(false)}><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nama Kelas</label>
                                <input required className="input-base" value={form.nama_kelas}
                                    onChange={e => setForm({ ...form, nama_kelas: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jenis</label>
                                    <select className="input-base" value={form.jenis_kelas} onChange={e => setForm({ ...form, jenis_kelas: e.target.value })}>
                                        {JENIS.map(j => <option key={j} value={j}>{j}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hari</label>
                                    <select className="input-base" value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Mulai</label>
                                    <input type="time" className="input-base" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jam Selesai</label>
                                    <input type="time" className="input-base" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pengajar</label>
                                <select className="input-base" value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                                    <option value="">-- Pilih Pengajar --</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ruangan</label>
                                <select className="input-base" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
                                    <option value="">-- Pilih Ruangan --</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.nama_ruangan}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1 justify-center">Batal</button>
                                <button type="submit" className="btn-primary flex-1 justify-center">
                                    <Save size={16} /> {editing ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
