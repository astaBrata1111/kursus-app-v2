"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Session {
    id: string;
    nama_kelas: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
    teachers?: { nama: string };
    rooms?: { nama_ruangan: string };
}

interface CalendarWidgetProps {
    sessions?: Session[];
}

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_MAP: Record<string, number> = {
    Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3,
    Kamis: 4, Jumat: 5, Sabtu: 6
};

const COLORS = [
    '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F97316', '#06B6D4'
];

export default function CalendarWidget({ sessions = [] }: CalendarWidgetProps) {
    const [view, setView] = useState(new Date());
    const today = new Date();

    const year = view.getFullYear();
    const month = view.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const getSessionsForDay = (day: number): Session[] => {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const dayName = Object.keys(DAY_MAP).find(k => DAY_MAP[k] === dayOfWeek) || '';
        return sessions.filter(s => s.hari === dayName);
    };

    const isToday = (day: number) =>
        today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

    const prev = () => setView(new Date(year, month - 1, 1));
    const next = () => setView(new Date(year, month + 1, 1));

    return (
        <div className="card p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {MONTHS_ID[month]} {year}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prev} className="p-1.5 rounded-lg hover:bg-amber-50 transition">
                        <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                    <button onClick={next} className="p-1.5 rounded-lg hover:bg-amber-50 transition">
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
                {DAYS_ID.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 2px 4px' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const daySessions = getSessionsForDay(day);
                    const today_ = isToday(day);
                    return (
                        <div key={day} className="flex flex-col items-center">
                            <div
                                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-colors"
                                style={{
                                    background: today_ ? 'var(--primary)' : 'transparent',
                                    color: today_ ? 'white' : 'var(--text-primary)',
                                    cursor: daySessions.length > 0 ? 'pointer' : 'default',
                                }}
                                title={daySessions.map(s => s.nama_kelas).join(', ')}
                            >
                                {day}
                            </div>
                            {daySessions.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]">
                                    {daySessions.slice(0, 3).map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: COLORS[idx % COLORS.length] }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Today's sessions legend */}
            {sessions.filter(s => s.hari === Object.keys(DAY_MAP).find(k => DAY_MAP[k] === today.getDay())).length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Hari Ini
                    </p>
                    <div className="space-y-1.5">
                        {sessions
                            .filter(s => s.hari === Object.keys(DAY_MAP).find(k => DAY_MAP[k] === today.getDay()))
                            .slice(0, 4)
                            .map((s, idx) => (
                                <div key={s.id} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                                    <div className="min-w-0">
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">
                                            {s.nama_kelas}
                                        </p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                            {s.jam_mulai?.slice(0, 5)} — {s.jam_selesai?.slice(0, 5)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
