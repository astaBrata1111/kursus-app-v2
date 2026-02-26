"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import {
    Calendar, Plus, Trash2, X, Save, Clock, User, Home,
    Search, Upload, AlertTriangle, LayoutList, LayoutGrid,
    Filter, ChevronDown, BookOpen, Users, Pencil
} from "lucide-react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import ICAL from 'ical.js';

interface Session {
    id: string; nama_kelas: string; jenis_kelas?: string;
    teacher_id?: string; teacher_id_2?: string; room_id?: string;
    hari: string; jam_mulai: string; jam_selesai: string;
    catatan?: string;
    teachers?: { nama: string }; teachers2?: { nama: string }; rooms?: { nama_ruangan: string };
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JENIS = ['General', 'Montessori', 'Business', 'HSK', 'Private', 'Trial'];
const jenisColor: Record<string, string> = {
    General: '#F59E0B', Montessori: '#8B5CF6', Business: '#3B82F6',
    HSK: '#10B981', Private: '#EC4899', Trial: '#6B7280',
};
const hariToInt: Record<string, number> = {
    Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6
};

const emptyForm = {
    nama_kelas: '', jenis_kelas: 'General', teacher_id: '', teacher_id_2: '',
    room_id: '', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '09:00', catatan: '',
};

export default function JadwalPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'week' | 'list'>('week');
    const [search, setSearch] = useState('');
    const [filterRoom, setFilterRoom] = useState('');
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterJenis, setFilterJenis] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [clearConfirmText, setClearConfirmText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [importing, setImporting] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const icsRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        const [{ data: s }, { data: t }, { data: r }] = await Promise.all([
            supabase.from('sessions').select('*, teachers!teacher_id(nama), teachers2:teachers!teacher_id_2(nama), rooms(nama_ruangan)').order('hari').order('jam_mulai'),
            supabase.from('teachers').select('id, nama'),
            supabase.from('rooms').select('id, nama_ruangan'),
        ]);
        if (s) setSessions(s);
        if (t) setTeachers(t);
        if (r) setRooms(r);
        setLoading(false);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        try {
            // Sanitize: empty string UUIDs must be null for Supabase
            const payload = {
                ...form,
                teacher_id: form.teacher_id || null,
                teacher_id_2: form.teacher_id_2 || null,
                room_id: form.room_id || null,
            };
            if (editing) {
                const { error } = await supabase.from('sessions').update(payload).eq('id', editing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('sessions').insert([payload]);
                if (error) throw error;
            }
            closeModal();
            fetchAll();
        } catch (err: any) {
            alert("Gagal menyimpan: " + (err.message || JSON.stringify(err)));
        }
    }

    async function handleDelete(id: string) {
        setDeleteConfirmId(id);
    }

    async function executeDelete() {
        if (!deleteConfirmId) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('sessions').delete().eq('id', deleteConfirmId);
            if (error) {
                console.error("Delete error:", error);
                alert("Gagal menghapus jadwal:\n" + error.message);
            }
        } catch (err: any) {
            console.error("Unexpected error:", err);
            alert("Terjadi kesalahan:\n" + err.message);
        } finally {
            setDeleteConfirmId(null);
            setIsDeleting(false);
            closeModal();
            fetchAll();
        }
    }

    async function handleClearAll() {
        if (clearConfirmText !== 'HAPUS') {
            alert('Ketik HAPUS untuk konfirmasi');
            return;
        }
        setClearing(true);
        try {
            const { error } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            setShowClearModal(false);
            setClearConfirmText('');
            fetchAll();
        } catch (err: any) {
            alert("Gagal menghapus: " + (err.message || JSON.stringify(err)));
        } finally {
            setClearing(false);
        }
    }

    function openEdit(s: Session) {
        try {
            setEditing(s);
            setForm({
                nama_kelas: s.nama_kelas || '',
                jenis_kelas: s.jenis_kelas || 'General',
                teacher_id: s.teacher_id || '',
                teacher_id_2: s.teacher_id_2 || '',
                room_id: s.room_id || '',
                hari: s.hari || 'Senin',
                jam_mulai: s.jam_mulai ? String(s.jam_mulai).slice(0, 5) : '08:00',
                jam_selesai: s.jam_selesai ? String(s.jam_selesai).slice(0, 5) : '09:00',
                catatan: s.catatan || '',
            });
            setShowModal(true);
        } catch (err: any) {
            console.error("Crash on openEdit:", err);
            alert("Terjadi kesalahan sistem saat membuka form edit: " + err.message);
        }
    }

    function closeModal() {
        setShowModal(false);
        setEditing(null);
        setForm(emptyForm);
    }

    async function handleImportICS(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const text = await file.text();
            const jcalData = ICAL.parse(text);
            const comp = new ICAL.Component(jcalData);
            const vevents = comp.getAllSubcomponents('vevent');
            if (vevents.length === 0) { alert("Tidak ada jadwal ditemukan."); return; }

            const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
            const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

            // Fetch teachers and rooms from DB to match names → IDs
            const [{ data: dbTeachers }, { data: dbRooms }] = await Promise.all([
                supabase.from('teachers').select('id, nama, alias'),
                supabase.from('rooms').select('id, nama_ruangan'),
            ]);
            const teacherList: any[] = dbTeachers || [];
            const roomList: any[] = dbRooms || [];

            // Helper: resolve teacher name (partial match) → id
            function findTeacherId(name: string): string | null {
                const n = name.toLowerCase().trim();
                const found = teacherList.find(t => {
                    if (t.nama?.toLowerCase().includes(n)) return true;
                    // alias is stored as text[] in Supabase
                    if (Array.isArray(t.alias) && t.alias.some((a: string) => a?.toLowerCase().includes(n))) return true;
                    return false;
                });
                return found?.id || null;
            }

            // Helper: resolve room name → id
            function findRoomId(name: string): string | null {
                const n = name.toLowerCase().trim();
                const found = roomList.find(r => r.nama_ruangan?.toLowerCase().includes(n));
                return found?.id || null;
            }

            // Parse description to extract: jenis_kelas, teacher names, room name
            function parseDescription(desc: string, summary: string) {
                const raw = desc
                    .replace(/<[^>]+>/g, '') // strip HTML
                    .replace(/\\n/g, '\n')
                    .split('\n')[0] // only first line is useful
                    .trim();

                let jenis_kelas = 'General';
                const s = summary.toLowerCase();
                const r = raw.toLowerCase();
                if (s.includes('trial') || r.includes('trial')) jenis_kelas = 'Trial';
                else if (r.includes('montessori') || s.includes('montessori')) jenis_kelas = 'Montessori';
                else if (r.includes('hsk') || s.includes('hsk')) jenis_kelas = 'HSK';
                else if (r.includes('business') || s.includes('business')) jenis_kelas = 'Business';
                else if (r.includes('private') || s.includes('private')) jenis_kelas = 'Private';

                // Extract teacher names: matches "Laoshi Nikke & Esta" or "Laoshi Nikke"
                let teacher_names: string[] = [];
                const laoshiMatch = raw.match(/laoshi[i]?\s+([A-Za-z]+(?:\s*[&,]\s*[A-Za-z]+)*)/i);
                if (laoshiMatch) {
                    teacher_names = laoshiMatch[1].split(/[&,]+/).map(t => t.trim()).filter(Boolean);
                }

                // Extract room: patterns like "(Beijing)", "(Shanghai)"
                let room_name = '';
                const roomMatch = raw.match(/\(([A-Za-z]+)\)/);
                if (roomMatch) {
                    const candidate = roomMatch[1];
                    // Only use it as room if it's not a teacher keyword
                    if (!['general', 'montessori', 'hsk', 'business', 'private', 'trial'].includes(candidate.toLowerCase())) {
                        room_name = candidate;
                    }
                }

                return { jenis_kelas, teacher_names, room_name };
            }

            // Map: groupKey → { session data, student names set }
            // Key = hari + time only, so recurring event modifications get merged together
            interface GroupedSession {
                hari: string; jam_mulai: string; jam_selesai: string;
                jenis_kelas: string; teacher_names: string[]; room_name: string;
                teacher_id: string | null; teacher_id_2: string | null; room_id: string | null;
                student_names: Set<string>; catatan: string;
            }
            const groupMap = new Map<string, GroupedSession>();

            for (const vevent of vevents) {
                const event = new ICAL.Event(vevent);
                const startIcal = event.startDate;
                const endIcal = event.endDate;
                if (!startIcal) continue;

                const startJsRaw = startIcal.toJSDate();
                const endJsRaw = endIcal ? endIcal.toJSDate() : startJsRaw;
                const dtStartProp = vevent.getFirstProperty('dtstart');
                const hasTzid = dtStartProp?.getParameter('tzid');
                const offset = hasTzid ? 0 : WIB_OFFSET_MS;
                const startWib = new Date(startJsRaw.getTime() + offset);
                const endWib = new Date(endJsRaw.getTime() + offset);

                const hari = hariMap[startWib.getDay()];
                const jam_mulai = `${String(startWib.getHours()).padStart(2, '0')}:${String(startWib.getMinutes()).padStart(2, '0')}`;
                const jam_selesai = `${String(endWib.getHours()).padStart(2, '0')}:${String(endWib.getMinutes()).padStart(2, '0')}`;

                const summaryRaw = (event.summary || '').replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
                const descRaw = event.description || '';
                const { jenis_kelas, teacher_names, room_name } = parseDescription(descRaw, summaryRaw);

                // Resolve both teachers and room IDs
                const tid1 = teacher_names[0] ? findTeacherId(teacher_names[0]) : null;
                const tid2 = teacher_names[1] ? findTeacherId(teacher_names[1]) : null;
                const rid = room_name ? findRoomId(room_name) : null;

                // Group key: same time slot + same teacher pair + same room = same class
                const groupKey = `${hari}|${jam_mulai}|${jam_selesai}|${teacher_names.slice(0, 2).join('+')}|${room_name}`;

                if (!groupMap.has(groupKey)) {
                    groupMap.set(groupKey, {
                        hari, jam_mulai, jam_selesai, jenis_kelas,
                        teacher_names, room_name,
                        teacher_id: tid1, teacher_id_2: tid2, room_id: rid,
                        student_names: new Set<string>(),
                        catatan: descRaw.replace(/\\n/g, '\n').replace(/<[^>]+>/g, '').split('\n')[0].trim(),
                    });
                }
                // Accumulate students from SUMMARY — e.g. "Alfie, Joses & Genevieve" → 3 names
                const students = summaryRaw.split(/[,&]+/).map(s => s.trim()).filter(s => s.length > 1);
                const group = groupMap.get(groupKey)!;
                students.forEach(s => group.student_names.add(s));
                // Update teacher/room if this event has more info than the initial entry
                if (!group.teacher_id && tid1) group.teacher_id = tid1;
                if (!group.teacher_id_2 && tid2) group.teacher_id_2 = tid2;
                if (!group.room_id && rid) group.room_id = rid;
            }

            // Build final session objects — ALL fields always present to avoid PostgREST 400
            const newSessions = Array.from(groupMap.values()).map(g => {
                const studentList = Array.from(g.student_names).join(', ');
                const nama_kelas = studentList || g.teacher_names.join(' & ') || 'Imported Class';
                return {
                    nama_kelas,
                    jenis_kelas: g.jenis_kelas,
                    hari: g.hari,
                    jam_mulai: g.jam_mulai,
                    jam_selesai: g.jam_selesai,
                    catatan: g.catatan || null,
                    teacher_id: g.teacher_id ?? null,
                    teacher_id_2: g.teacher_id_2 ?? null,
                    room_id: g.room_id ?? null,
                };
            });

            if (newSessions.length === 0) { alert("Tidak ada jadwal yang bisa diimpor."); return; }
            const { error } = await supabase.from('sessions').insert(newSessions);
            if (error) throw new Error(error.message);
            alert(`✅ Berhasil mengimpor ${newSessions.length} sesi (dari ${vevents.length} events, sudah digabung berdasarkan waktu + guru + ruangan).`);
            fetchAll();
        } catch (err: any) {
            alert("Gagal import ICS: " + (err?.message || JSON.stringify(err)));
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    }

    const filtered = sessions.filter(s => {
        const q = search.toLowerCase();
        return (
            (!search || s.nama_kelas.toLowerCase().includes(q) || s.teachers?.nama?.toLowerCase().includes(q)) &&
            (!filterRoom || s.room_id === filterRoom) &&
            (!filterTeacher || s.teacher_id === filterTeacher) &&
            (!filterJenis || s.jenis_kelas === filterJenis)
        );
    });

    // Recurring events need startRecur/endRecur for month grid to place them on dates
    const recurStart = '2020-01-01';
    const recurEnd = '2030-12-31';
    const calendarEvents = filtered.map(s => ({
        id: s.id,
        title: s.nama_kelas,
        daysOfWeek: [hariToInt[s.hari]],
        startTime: s.jam_mulai,
        endTime: s.jam_selesai,
        startRecur: recurStart,
        endRecur: recurEnd,
        backgroundColor: jenisColor[s.jenis_kelas || 'General'] || '#F59E0B',
        borderColor: 'transparent',
        extendedProps: { session: s }
    }));

    // Stats
    const sessionsByJenis = JENIS.map(j => ({ jenis: j, count: sessions.filter(s => s.jenis_kelas === j).length })).filter(x => x.count > 0);

    return (
        <div className="space-y-5">
            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                            <Calendar size={20} />
                        </div>
                        Jadwal Kelas
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {loading ? '...' : `${sessions.length} sesi aktif`}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* View Toggle */}
                    <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                        <button onClick={() => setView('week')} title="Kalender"
                            className="p-2.5 transition-all"
                            style={{ background: view === 'week' ? '#8B5CF6' : 'white', color: view === 'week' ? 'white' : 'var(--text-muted)' }}>
                            <LayoutGrid size={16} />
                        </button>
                        <button onClick={() => setView('list')} title="Daftar"
                            className="p-2.5 transition-all border-l"
                            style={{ background: view === 'list' ? '#8B5CF6' : 'white', color: view === 'list' ? 'white' : 'var(--text-muted)', borderColor: 'var(--border)' }}>
                            <LayoutList size={16} />
                        </button>
                    </div>

                    {/* Import ICS */}
                    <input ref={icsRef} type="file" accept=".ics" onChange={handleImportICS} disabled={importing} className="hidden" />
                    <button onClick={() => icsRef.current?.click()} disabled={importing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                        style={{ background: 'white', color: '#3B82F6', borderColor: '#3B82F6' }}>
                        {importing ? <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" /> : <Upload size={15} />}
                        <span className="hidden sm:inline">{importing ? 'Importing...' : 'Import ICS'}</span>
                    </button>

                    {/* Clear All */}
                    <button onClick={() => setShowClearModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                        style={{ background: 'white', color: '#EF4444', borderColor: '#EF4444' }}>
                        <Trash2 size={15} />
                        <span className="hidden sm:inline">Hapus Semua</span>
                    </button>

                    {/* Add Session */}
                    <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                        <Plus size={16} />
                        Tambah Jadwal
                    </button>
                </div>
            </div>

            {/* ── STATS ROW ── */}
            {!loading && sessions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Total Sesi</p>
                        <p className="text-3xl font-black mt-1">{sessions.length}</p>
                        <p className="text-xs opacity-70 mt-1">Jadwal aktif</p>
                    </div>
                    <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Pengajar</p>
                        <p className="text-3xl font-black mt-1">{teachers.length}</p>
                        <p className="text-xs opacity-70 mt-1">Terdaftar</p>
                    </div>
                    <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #10B981, #047857)' }}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Ruangan</p>
                        <p className="text-3xl font-black mt-1">{rooms.length}</p>
                        <p className="text-xs opacity-70 mt-1">Tersedia</p>
                    </div>
                    <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-wider">Hari Aktif</p>
                        <p className="text-3xl font-black mt-1">{new Set(sessions.map(s => s.hari)).size}</p>
                        <p className="text-xs opacity-70 mt-1">Dari 7 hari</p>
                    </div>
                </div>
            )}

            {/* ── FILTER BAR ── */}
            <div className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid var(--border)' }}>
                <div className="relative flex-1" style={{ minWidth: '140px' }}>
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 border-transparent outline-none focus:ring-2 focus:ring-purple-400"
                        placeholder="Cari kelas..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="text-sm px-3 py-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-400 border-0"
                    value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
                    <option value="">Semua Jenis</option>
                    {JENIS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <select className="text-sm px-3 py-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-400 border-0"
                    value={filterRoom} onChange={e => setFilterRoom(e.target.value)}>
                    <option value="">Semua Ruangan</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.nama_ruangan}</option>)}
                </select>
                <select className="text-sm px-3 py-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-purple-400 border-0"
                    value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                    <option value="">Semua Pengajar</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                </select>
                {/* Legend dots */}
                <div className="hidden xl:flex gap-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
                    {JENIS.map(j => (
                        <div key={j} className="flex items-center gap-1 cursor-pointer" onClick={() => setFilterJenis(filterJenis === j ? '' : j)}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: jenisColor[j] }} />
                            <span className="text-[10px] font-bold" style={{ color: filterJenis === j ? jenisColor[j] : 'var(--text-muted)' }}>{j}</span>
                        </div>
                    ))}
                </div>
                {(search || filterRoom || filterTeacher || filterJenis) && (
                    <button className="text-xs text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded-lg"
                        onClick={() => { setSearch(''); setFilterRoom(''); setFilterTeacher(''); setFilterJenis(''); }}>
                        ✕ Reset
                    </button>
                )}
            </div>

            {/* ── CALENDAR VIEW ── */}
            {view === 'week' && (
                <div className="rounded-2xl overflow-hidden shadow-sm bg-white" style={{ border: '1px solid var(--border)' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .fc { --fc-border-color: #F1F5F9; --fc-button-bg-color: #8B5CF6; --fc-button-border-color: #8B5CF6; --fc-button-hover-bg-color: #7C3AED; --fc-button-hover-border-color: #7C3AED; --fc-button-active-bg-color: #6D28D9; --fc-today-bg-color: #F5F3FF; }
                        .fc-toolbar { padding: 12px 16px; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: 8px; }
                        .fc-toolbar-title { font-weight: 900 !important; font-size: 1rem !important; color: #1E293B; }
                        .fc-button { font-weight: 700 !important; text-transform: capitalize !important; border-radius: 10px !important; padding: 5px 10px !important; font-size: 0.78rem !important; }
                        .fc-timegrid-event, .fc-event { cursor: pointer; border-radius: 8px !important; border: none !important; box-shadow: 0 2px 6px rgba(0,0,0,0.12); transition: transform 0.15s, box-shadow 0.15s; }
                        .fc-timegrid-event:hover, .fc-event:hover { transform: translateY(-1px) scale(1.01); box-shadow: 0 6px 16px rgba(0,0,0,0.18) !important; z-index: 50 !important; }
                        .fc-timegrid-slot-label { font-size: 0.7rem; font-weight: 700; color: #94A3B8; }
                        .fc-col-header-cell-cushion { font-weight: 800; color: #334155; padding: 10px 4px; font-size: 0.82rem; text-decoration: none !important; }
                        .fc-timegrid-event .fc-event-main { padding: 4px 6px; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
                        .fc-daygrid-event { border-radius: 6px !important; padding: 1px 4px !important; font-size: 0.7rem !important; font-weight: 700 !important; color: white !important; border: none !important; margin-bottom: 1px !important; }
                        .fc-daygrid-event .fc-event-title { color: white !important; font-weight: 700 !important; }
                        .fc-daygrid-event .fc-event-time { color: rgba(255,255,255,0.8) !important; font-size: 0.65rem !important; }
                        @media (max-width: 639px) {
                            .fc-toolbar { padding: 10px 12px; }
                            .fc-toolbar-title { font-size: 0.9rem !important; }
                            .fc-button { padding: 4px 8px !important; font-size: 0.72rem !important; }
                            .fc-toolbar-chunk { display: flex; gap: 4px; }
                            .fc-col-header-cell-cushion { font-size: 0.7rem; padding: 6px 2px; }
                        }
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
                        dayMaxEvents={5}
                        slotMinTime="07:00:00"
                        slotMaxTime="21:00:00"
                        allDaySlot={false}
                        height="auto"
                        contentHeight={760}
                        slotEventOverlap={true}
                        eventMinHeight={24}
                        expandRows={true}
                        eventClick={info => {
                            if (info.jsEvent) info.jsEvent.preventDefault();
                            const session = sessions.find(x => x.id === info.event.id);
                            if (session) openEdit(session);
                        }}
                        eventContent={arg => {
                            const s = sessions.find(x => x.id === arg.event.id) as Session;
                            if (!s) return undefined;
                            const viewType = arg.view.type;

                            // List/Agenda view: render rich row content
                            if (viewType === 'listWeek' || viewType === 'listDay' || viewType === 'listMonth') {
                                return (
                                    <div className="flex items-center gap-2 py-0.5 w-full">
                                        <div className="font-bold text-sm truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                                            {arg.event.title}
                                        </div>
                                        {s.teachers?.nama && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold whitespace-nowrap">{s.teachers.nama}</span>
                                        )}
                                        {s.rooms?.nama_ruangan && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold whitespace-nowrap">{s.rooms.nama_ruangan}</span>
                                        )}
                                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white whitespace-nowrap" style={{ background: jenisColor[s.jenis_kelas || 'General'] }}>{s.jenis_kelas || 'General'}</span>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(s); }}
                                                className="p-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--info)' }}><Pencil size={13} /></button>
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(s.id); }}
                                                className="p-1 rounded-lg hover:bg-black/5" style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                );
                            }

                            // Month view: use FullCalendar default rendering (returns undefined)
                            if (viewType === 'dayGridMonth') return undefined;

                            // Week / Day time-grid view
                            return (
                                <div className="text-[0.7rem] text-white leading-tight overflow-hidden w-full h-full">
                                    <div className="font-black truncate">{arg.event.title}</div>
                                    <div className="opacity-80">{arg.timeText}</div>
                                    {s.teachers?.nama && <div className="opacity-75 truncate">{s.teachers.nama}</div>}
                                    {s.rooms?.nama_ruangan && <div className="opacity-75 truncate">{s.rooms.nama_ruangan}</div>}
                                </div>
                            );
                        }}
                    />
                </div>
            )}

            {/* ── LIST VIEW ── */}
            {view === 'list' && (
                <div className="space-y-2">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-2xl skeleton" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="rounded-2xl p-14 text-center bg-white" style={{ border: '1px solid var(--border)' }}>
                            <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-bold text-lg" style={{ color: 'var(--text-muted)' }}>Tidak ada jadwal</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Coba ubah filter atau tambah jadwal baru</p>
                        </div>
                    ) : DAYS.map(hari => {
                        const daySessions = filtered.filter(s => s.hari === hari);
                        if (daySessions.length === 0) return null;
                        return (
                            <div key={hari}>
                                {/* Day header */}
                                <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{hari}</p>
                                    <div className="flex-1 h-px bg-slate-100" />
                                    <span className="text-xs font-bold text-purple-500">{daySessions.length} sesi</span>
                                </div>
                                {daySessions.sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai)).map(s => {
                                    const color = jenisColor[s.jenis_kelas || 'General'] || '#F59E0B';
                                    return (
                                        <div
                                            key={s.id}
                                            className="group mb-2 flex items-center gap-0 rounded-2xl overflow-hidden bg-white transition-all hover:shadow-lg cursor-pointer"
                                            style={{ border: '1px solid var(--border)' }}
                                            onClick={() => openEdit(s)}
                                        >
                                            {/* Color accent */}
                                            <div className="w-1.5 self-stretch shrink-0" style={{ background: color }} />

                                            {/* Icon + Name */}
                                            <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-black shadow-sm"
                                                    style={{ background: color }}>
                                                    {(s.jenis_kelas || 'G')[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.nama_kelas}</p>
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5"
                                                        style={{ background: color + '20', color }}>
                                                        {s.jenis_kelas || 'General'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Time */}
                                            <div className="flex flex-col items-center px-4 py-3 border-l shrink-0" style={{ borderColor: 'var(--border)', minWidth: '100px' }}>
                                                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Waktu</p>
                                                <div className="flex items-center gap-1 font-bold text-xs" style={{ color }}>
                                                    <Clock size={11} />
                                                    {s.jam_mulai.slice(0, 5)} – {s.jam_selesai.slice(0, 5)}
                                                </div>
                                            </div>

                                            {/* Teacher */}
                                            <div className="hidden md:flex flex-col px-4 py-3 border-l shrink-0" style={{ borderColor: 'var(--border)', minWidth: '130px' }}>
                                                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Pengajar</p>
                                                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <User size={11} style={{ color }} />
                                                    {s.teachers?.nama || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
                                                </div>
                                            </div>

                                            {/* Room */}
                                            <div className="hidden lg:flex flex-col px-4 py-3 border-l shrink-0" style={{ borderColor: 'var(--border)', minWidth: '110px' }}>
                                                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Ruangan</p>
                                                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    <Home size={11} style={{ color }} />
                                                    {s.rooms?.nama_ruangan || '—'}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={e => e.stopPropagation()}>
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(s); }}
                                                    className="p-2 rounded-xl transition-colors hover:bg-blue-50"
                                                    style={{ color: 'var(--info)' }} title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(s.id); }}
                                                    className="p-2 rounded-xl transition-colors hover:bg-red-50"
                                                    style={{ color: 'var(--danger)' }} title="Hapus">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── ADD / EDIT MODAL ── */}
            {showModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4"
                            style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white' }}>
                            <div>
                                <h2 className="text-base font-black">{editing ? 'Edit Jadwal' : 'Jadwal Baru'}</h2>
                                <p className="text-xs opacity-70 mt-0.5">{editing ? 'Perbarui informasi jadwal' : 'Isi form untuk menambah jadwal'}</p>
                            </div>
                            <button onClick={closeModal} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {/* Nama Kelas */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Nama Kelas *</label>
                                <input required className="w-full px-4 py-3 rounded-xl text-sm font-semibold border-2 outline-none transition-all focus:border-purple-400"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface)' }}
                                    placeholder="Contoh: Mandarin Dasar A"
                                    value={form.nama_kelas} onChange={e => setForm({ ...form, nama_kelas: e.target.value })} />
                            </div>

                            {/* Jenis + Hari */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Jenis Kelas</label>
                                    <select className="w-full px-3 py-3 rounded-xl text-sm font-semibold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.jenis_kelas} onChange={e => setForm({ ...form, jenis_kelas: e.target.value })}>
                                        {JENIS.map(j => <option key={j} value={j}>{j}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Hari</label>
                                    <select className="w-full px-3 py-3 rounded-xl text-sm font-semibold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })}>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Jam Mulai</label>
                                    <input type="time" className="w-full px-3 py-3 rounded-xl text-sm font-bold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Jam Selesai</label>
                                    <input type="time" className="w-full px-3 py-3 rounded-xl text-sm font-bold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} />
                                </div>
                            </div>

                            {/* Teachers */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pengajar 1</label>
                                    <select className="w-full px-3 py-3 rounded-xl text-sm font-semibold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                                        <option value="">— Pilih Pengajar —</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pengajar 2 <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>(opsional)</span></label>
                                    <select className="w-full px-3 py-3 rounded-xl text-sm font-semibold border-2 outline-none focus:border-purple-400"
                                        style={{ borderColor: 'var(--border)' }}
                                        value={form.teacher_id_2} onChange={e => setForm({ ...form, teacher_id_2: e.target.value })}>
                                        <option value="">— Tidak ada —</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Room */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ruangan</label>
                                <select className="w-full px-3 py-3 rounded-xl text-sm font-semibold border-2 outline-none focus:border-purple-400"
                                    style={{ borderColor: 'var(--border)' }}
                                    value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}>
                                    <option value="">— Pilih Ruangan —</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.nama_ruangan}</option>)}
                                </select>
                            </div>

                            {/* Trial Info */}
                            {form.jenis_kelas === 'Trial' && (
                                <div className="p-4 rounded-2xl space-y-2" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                                    <label className="text-[11px] font-black uppercase tracking-wider text-purple-600">Info Trial (Nama Murid / Ortu / No. HP)</label>
                                    <textarea className="w-full px-3 py-2 rounded-xl text-sm border-2 outline-none focus:border-purple-400 bg-white"
                                        style={{ borderColor: '#DDD6FE' }}
                                        rows={2}
                                        placeholder="Contoh: Budi (Anak), Ibu Sari (08123456789)"
                                        value={form.catatan}
                                        onChange={e => setForm({ ...form, catatan: e.target.value })} />
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-2 pt-2">
                                {editing && (
                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(editing.id); }}
                                        className="px-4 py-3 font-bold rounded-xl border-2 transition-all hover:bg-red-50"
                                        style={{ borderColor: '#FCA5A5', color: '#EF4444' }} title="Hapus Jadwal">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button type="button" onClick={closeModal}
                                    className="flex-1 px-4 py-3 font-bold rounded-xl border-2 transition-all text-sm"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                                    Batal
                                </button>
                                <button type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-black rounded-xl text-white text-sm shadow-md transition-all hover:shadow-lg"
                                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' }}>
                                    <Save size={16} />
                                    {editing ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body)}

            {/* ── CLEAR ALL MODAL ── */}
            {showClearModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 text-center" style={{ background: '#FEF2F2' }}>
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={28} className="text-red-500" />
                            </div>
                            <h2 className="text-xl font-black text-red-700">Hapus Semua Jadwal</h2>
                            <p className="text-sm text-red-500 mt-1">Tindakan ini tidak dapat dibatalkan!</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700">
                                ⚠️ Semua <strong>{sessions.length} sesi</strong> akan dihapus permanen dari database.
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-red-500">
                                    Ketik <strong>HAPUS</strong> untuk konfirmasi
                                </label>
                                <input
                                    className="w-full px-4 py-3 rounded-xl text-sm font-bold border-2 outline-none focus:border-red-400"
                                    style={{ borderColor: '#FECACA' }}
                                    placeholder="HAPUS"
                                    value={clearConfirmText}
                                    onChange={e => setClearConfirmText(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => { setShowClearModal(false); setClearConfirmText(''); }}
                                    className="flex-1 px-4 py-3 font-bold rounded-xl border-2 text-sm"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                                    Batal
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={clearConfirmText !== 'HAPUS' || clearing}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-black rounded-xl text-white text-sm transition-all"
                                    style={{
                                        background: clearConfirmText === 'HAPUS' ? '#EF4444' : '#FCA5A5',
                                        cursor: clearConfirmText !== 'HAPUS' ? 'not-allowed' : 'pointer',
                                    }}>
                                    {clearing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 size={15} />}
                                    {clearing ? 'Menghapus...' : 'Ya, Hapus Semua'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                , document.body)}
            {/* ── DELETE CONFIRMATION MODAL ── */}
            {deleteConfirmId && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Hapus Jadwal?</h3>
                            <p className="text-sm shadow-sm" style={{ color: 'var(--text-muted)' }}>
                                Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                        </div>
                        <div className="p-4 flex gap-3 bg-gray-50/80">
                            <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}
                                className="flex-1 py-3 font-bold rounded-xl border border-gray-200 bg-white transition-colors hover:bg-gray-100"
                                style={{ color: 'var(--text-primary)' }}>
                                Batal
                            </button>
                            <button onClick={executeDelete} disabled={isDeleting}
                                className="flex-1 py-3 font-bold rounded-xl text-white transition-opacity flex items-center justify-center gap-2"
                                style={{ background: '#DC2626', opacity: isDeleting ? 0.7 : 1 }}>
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
