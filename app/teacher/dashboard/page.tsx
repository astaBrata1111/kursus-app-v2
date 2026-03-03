"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, UserCheck, TrendingUp, Clock, CheckCircle, X } from "lucide-react";
import CalendarWidget from "@/app/components/CalendarWidget";
import { useSettings } from "@/app/components/SettingsProvider";

export default function TeacherDashboard() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [todaySessions, setToday] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [teacherName, setTeacherName] = useState('');
    const [stats, setStats] = useState({ totalKelas: 0, kelihadir: 0, kelasMingguIni: 0 });
    const { t, settings } = useSettings();
    const locale = settings?.language === 'zh' ? 'zh-CN' : settings?.language === 'en' ? 'en-US' : 'id-ID';


    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from('user_profiles').select('email').eq('id', user.id).single();
            setTeacherName(profile?.email?.split('@')[0] || 'Pengajar');

            // Find teacher record
            const { data: teacher } = await supabase.from('teachers').select('id, nama').ilike('nama', `%${profile?.email?.split('@')[0]}%`).single();

            let teacherSessions = [];
            if (teacher) {
                const { data: s } = await supabase
                    .from('sessions').select('*, rooms(nama_ruangan)').eq('teacher_id', teacher.id);
                if (s) { setSessions(s); teacherSessions = s; }

                // Today's sessions
                const today = new Date();
                const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                const todayName = dayNames[today.getDay()];
                setToday(s?.filter((x: any) => x.hari === todayName).sort((a: any, b: any) => a.jam_mulai.localeCompare(b.jam_mulai)) || []);

                // Stats
                const { count: absCnt } = await supabase.from('absensi').select('*', { count: 'exact', head: true }).in('session_id', s?.map((x: any) => x.id) || []).eq('status', 'Hadir');
                setStats({ totalKelas: s?.length || 0, kelihadir: absCnt || 0, kelasMingguIni: todaySessions.length });
            }
            setLoading(false);
        })();
    }, []);

    const today = new Date();
    const dayNamesId = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayNamesZh = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const currentDayNames = settings?.language === 'en' ? dayNamesEn : settings?.language === 'zh' ? dayNamesZh : dayNamesId;


    return (
        <div className="space-y-6">
            <div>
                <h1 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    {t('welcome_message').replace('{name}', teacherName)} 👩‍🏫
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {today.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: t('total_classes'), val: stats.totalKelas, icon: <Calendar size={20} />, color: '#8B5CF6' },
                    { label: t('students_present_total'), val: stats.kelihadir, icon: <UserCheck size={20} />, color: '#10B981' },
                    { label: t('classes_this_week'), val: stats.kelasMingguIni, icon: <TrendingUp size={20} />, color: '#F59E0B' },
                ].map(s => (
                    <div key={s.label} className="card p-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ background: s.color }}>{s.icon}</div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{loading ? '...' : s.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Today's schedule */}
                <div className="xl:col-span-2 card overflow-hidden">
                    <div className="p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                        <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                            {t('classes_today')} — {currentDayNames[today.getDay()]}
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
                        </div>
                    ) : todaySessions.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: '#D1FAE5' }} />
                            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('no_classes_today')}</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                            {todaySessions.map(s => (
                                <div key={s.id} className="flex items-center gap-4 p-5">
                                    <div className="w-16 text-center">
                                        <p style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary-dark)' }}>{s.jam_mulai.slice(0, 5)}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            — {s.jam_selesai.slice(0, 5)}
                                        </p>
                                    </div>
                                    <div className="w-px h-12" style={{ background: 'var(--primary-light)' }} />
                                    <div className="flex-1">
                                        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.nama_kelas}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {s.rooms?.nama_ruangan || t('room_not_assigned')}
                                        </p>
                                    </div>
                                    <span className="badge badge-amber">{s.jenis_kelas || t('badge_general')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <CalendarWidget sessions={sessions} />
            </div>

            {/* All schedule */}
            <div className="card overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t('all_teaching_schedules')}</h3>
                </div>
                <table className="table-base">
                    <thead><tr><th>{t('col_class')}</th><th>{t('col_day')}</th><th>{t('col_time')}</th><th>{t('col_room')}</th><th>{t('col_type')}</th></tr></thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><div className="h-4 skeleton rounded" /></td>)}</tr>)
                        ) : sessions.map(s => (
                            <tr key={s.id}>
                                <td style={{ fontWeight: 700 }}>{s.nama_kelas}</td>
                                <td>{s.hari}</td>
                                <td><div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-muted)' }}><Clock size={13} />{s.jam_mulai.slice(0, 5)}-{s.jam_selesai.slice(0, 5)}</div></td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.rooms?.nama_ruangan || '—'}</td>
                                <td><span className="badge badge-amber">{s.jenis_kelas || t('badge_general')}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
