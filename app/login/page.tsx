"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BookOpen, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                // Translate common Supabase auth errors to Indonesian
                const msg = signInError.message;
                if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
                    throw new Error('Email atau password salah. Periksa kembali dan coba lagi.');
                }
                if (msg.includes('Email not confirmed')) {
                    throw new Error('Email belum dikonfirmasi. Cek kotak masuk email Anda.');
                }
                throw signInError;
            }

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles').select('role, is_active').eq('id', user.id).single();

                if (profileError || !profile) {
                    // User exists in auth but has no profile row yet
                    throw new Error('Profil pengguna tidak ditemukan. Hubungi administrator untuk mengaktifkan akun Anda.');
                }
                if (!profile.is_active) throw new Error('Akun Anda tidak aktif. Hubungi administrator.');

                switch (profile.role) {
                    case 'admin': router.push('/admin'); break;
                    case 'teacher': router.push('/teacher/dashboard'); break;
                    case 'student': router.push('/student/dashboard'); break;
                    case 'parent': router.push('/parent/dashboard'); break;
                    default:
                        // Unknown role — show what role was found so admin can debug
                        throw new Error(`Role "${profile.role}" belum dikonfigurasi. Hubungi administrator.`);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login gagal. Periksa email dan password.');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (e: string, p: string) => { setEmail(e); setPassword(p); };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-app)' }}>
            {/* Left: decorative amber panel */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 60%, #92400E 100%)' }}>
                {/* Decorative circles */}
                <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full" />
                <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-white/10 rounded-full" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">Mingxian</p>
                            <p className="text-amber-200 text-xs font-semibold">Kursus App v2</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <h1 className="text-white font-black text-4xl leading-tight mb-4">
                        Sistem Manajemen<br />Kursus Premium
                    </h1>
                    <p className="text-amber-100 text-base leading-relaxed max-w-sm">
                        Platform lengkap untuk mengelola jadwal, murid, pembayaran, absensi, dan notifikasi WhatsApp otomatis.
                    </p>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        {[
                            { label: 'Murid Aktif', value: '150+' },
                            { label: 'Pengajar', value: '12' },
                            { label: 'Sesi/Minggu', value: '45+' },
                            { label: 'Uptime', value: '99.9%' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/10 rounded-2xl p-4">
                                <p className="text-white font-black text-2xl">{s.value}</p>
                                <p className="text-amber-200 text-xs font-semibold mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-amber-200/60 text-xs">
                    © {new Date().getFullYear()} Mingxian.id · All rights reserved
                </p>
            </div>

            {/* Right: login form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Mingxian App</p>
                    </div>

                    <div className="mb-8">
                        <h2 style={{ fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Selamat Datang!</h2>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Masuk ke akun Anda untuk melanjutkan.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Email</label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-base"
                                placeholder="nama@email.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPw ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-base pr-11"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-muted)' }}>
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--danger-bg)', border: '1px solid #FCA5A5' }}>
                                <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-base py-3 mt-2">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Masuk Sekarang <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    {/* Dev quick logins */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'center', textTransform: 'uppercase' }}>
                                Development Quick Login
                            </p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem' }}>
                                ⚠️ Isi email/password — akun harus sudah ada di Supabase
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'Admin', email: 'admin@test.com', pw: 'admin123', color: '#F59E0B' },
                                    { label: 'Teacher', email: 'teacher@test.com', pw: 'teacher123', color: '#3B82F6' },
                                    { label: 'Student', email: 'student@test.com', pw: 'student123', color: '#10B981' },
                                    { label: 'Parent', email: 'parent@test.com', pw: 'parent123', color: '#8B5CF6' },
                                ].map(q => (
                                    <button key={q.label} type="button"
                                        onClick={() => quickLogin(q.email, q.pw)}
                                        className="px-3 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90"
                                        style={{ background: q.color }}>
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
