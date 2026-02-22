"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserCheck, Search, CheckCircle, X, AlertCircle, Clock, BookOpen } from "lucide-react";

type AbsensiStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

const STATUS_OPTIONS: { value: AbsensiStatus; label: string; color: string }[] = [
    { value: 'hadir', label: 'Hadir', color: '#16A34A' },
    { value: 'izin', label: 'Izin', color: '#2563EB' },
    { value: 'sakit', label: 'Sakit', color: '#D97706' },
    { value: 'alpha', label: 'Alpha', color: '#DC2626' },
];

export default function AbsensiAdminPage() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [absensi, setAbsensi] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { if (selectedSession) fetchAbsensi(); }, [selectedSession, selectedDate]);

    async function fetchData() {
        setLoading(true);
        const [{ data: s }, { data: st }] = await Promise.all([
            supabase.from('sessions').select('*, teachers(nama)').order('hari'),
            supabase.from('students').select('id, nama, level').order('nama'),
        ]);
        if (s) setSessions(s);
        if (st) setStudents(st);
        if (s?.length) setSelectedSession(s[0].id);
        setLoading(false);
    }

    async function fetchAbsensi() {
        const { data } = await supabase.from('absensi')
            .select('*')
            .eq('session_id', selectedSession)
            .eq('tanggal', selectedDate);
        if (data) setAbsensi(data);
    }

    const getStatus = (studentId: string): AbsensiStatus | null => {
        return absensi.find(a => a.student_id === studentId)?.status || null;
    };

    async function markAbsensi(studentId: string, status: AbsensiStatus) {
        const existing = absensi.find(a => a.student_id === studentId);
        if (existing) {
            await supabase.from('absensi').update({ status }).eq('id', existing.id);
        } else {
            await supabase.from('absensi').insert({
                session_id: selectedSession, student_id: studentId,
                status, tanggal: selectedDate,
            });
        }
        fetchAbsensi();
    }

    const sessionStudents = students.filter(s =>
        !search || s.nama.toLowerCase().includes(search.toLowerCase())
    );

    const summary = {
        hadir: absensi.filter(a => a.status === 'hadir').length,
        izin: absensi.filter(a => a.status === 'izin').length,
        sakit: absensi.filter(a => a.status === 'sakit').length,
        alpha: absensi.filter(a => a.status === 'alpha').length,
    };

    const currentSession = sessions.find(s => s.id === selectedSession);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#10B981' }}>
                        <UserCheck size={22} />
                    </div>
                    Manajemen Absensi
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Tandai kehadiran murid per sesi kelas
                </p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Pilih Kelas
                    </label>
                    <select className="input-base" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                        {sessions.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.nama_kelas} — {s.hari} {s.jam_mulai?.slice(0, 5)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Tanggal
                    </label>
                    <input type="date" className="input-base" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Cari Murid
                    </label>
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input className="input-base pl-9" placeholder="Nama murid..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Session info */}
            {currentSession && (
                <div className="card p-4 flex items-center gap-4 bg-amber-50 border-amber-200">
                    <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                    <div>
                        <p style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{currentSession.nama_kelas}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {currentSession.hari} · {currentSession.jam_mulai?.slice(0, 5)} - {currentSession.jam_selesai?.slice(0, 5)}
                            {currentSession.teachers?.nama && ` · ${currentSession.teachers.nama}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
                {STATUS_OPTIONS.map(s => (
                    <div key={s.value} className="card p-3 text-center">
                        <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{(summary as any)[s.value]}</p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Student list */}
            <div className="card overflow-hidden">
                {sessionStudents.map((student, idx) => {
                    const currentStatus = getStatus(student.id);
                    return (
                        <div key={student.id} className="flex items-center justify-between p-4"
                            style={{ borderBottom: idx < sessionStudents.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                                    style={{ background: 'var(--primary)' }}>{student.nama[0]}</div>
                                <div>
                                    <p style={{ fontWeight: 700 }}>{student.nama}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.level}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {STATUS_OPTIONS.map(s => (
                                    <button key={s.value} onClick={() => markAbsensi(student.id, s.value)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                        style={{
                                            background: currentStatus === s.value ? s.color : 'var(--bg-secondary)',
                                            color: currentStatus === s.value ? 'white' : 'var(--text-muted)',
                                            border: `1.5px solid ${currentStatus === s.value ? s.color : 'var(--border)'}`,
                                        }}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {sessionStudents.length === 0 && (
                    <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                        <UserCheck size={32} className="mx-auto mb-3 opacity-30" />
                        <p>Belum ada murid terdaftar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
