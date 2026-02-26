"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard, GraduationCap, Users, Home, Calendar, CreditCard,
    LogOut, Menu, ChevronLeft, ClipboardList, Bell, Search,
    BookOpen, UserCheck, BarChart2, Package, MessageSquare, X,
    TrendingUp, Baby
} from "lucide-react";

/** ─── Types ─────────────────────────────────────────────── */
type Role = 'admin' | 'teacher' | 'student' | 'parent' | null;

interface NavItemDef {
    href: string;
    icon: ReactNode;
    label: string;
    badge?: number;
}

/** ─── Nav items per role ─────────────────────────────────── */
const adminNav: NavItemDef[] = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/admin/jadwal', icon: <Calendar size={20} />, label: 'Jadwal' },
    { href: '/admin/murid', icon: <Users size={20} />, label: 'Data Murid' },
    { href: '/admin/pengajar', icon: <GraduationCap size={20} />, label: 'Pengajar' },
    { href: '/admin/ruangan', icon: <Home size={20} />, label: 'Ruangan' },
    { href: '/admin/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { href: '/admin/absensi', icon: <UserCheck size={20} />, label: 'Absensi' },
    { href: '/admin/paket', icon: <Package size={20} />, label: 'Paket Kursus' },
    { href: '/admin/laporan', icon: <BarChart2 size={20} />, label: 'Laporan' },
    { href: '/admin/trials', icon: <TrendingUp size={20} />, label: 'Trial Funnel' },
    { href: '/admin/notifikasi', icon: <MessageSquare size={20} />, label: 'Notifikasi WA' },
    { href: '/admin/checklist', icon: <ClipboardList size={20} />, label: 'Checklist Harian' },
];

const teacherNav: NavItemDef[] = [
    { href: '/teacher/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/teacher/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Mengajar' },
    { href: '/teacher/absensi', icon: <UserCheck size={20} />, label: 'Absensi Kelas' },
    { href: '/teacher/nilai', icon: <TrendingUp size={20} />, label: 'Nilai & Catatan' },
];

const studentNav: NavItemDef[] = [
    { href: '/student/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/student/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Kelas' },
    { href: '/student/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { href: '/student/absensi', icon: <UserCheck size={20} />, label: 'Absensi Saya' },
];

const parentNav: NavItemDef[] = [
    { href: '/parent/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/parent/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Anak' },
    { href: '/parent/pembayaran', icon: <CreditCard size={20} />, label: 'Tagihan' },
    { href: '/parent/absensi', icon: <UserCheck size={20} />, label: 'Absensi Anak' },
    { href: '/parent/laporan', icon: <BookOpen size={20} />, label: 'Laporan Belajar' },
];

const navByRole: Record<string, NavItemDef[]> = {
    admin: adminNav, teacher: teacherNav,
    student: studentNav, parent: parentNav,
};

/** ─── Single Nav Item ───────────────────────────────────── */
function NavItem({ href, icon, label, active, collapsed }: NavItemDef & { active: boolean; collapsed: boolean }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
            style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'white' : 'var(--text-sidebar)',
                fontWeight: active ? '700' : '600',
                fontSize: '0.875rem',
            }}
            title={collapsed ? label : undefined}
        >
            <span className={`shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : ''}`}>
                {icon}
            </span>
            {!collapsed && (
                <span className="whitespace-nowrap transition-all duration-200">{label}</span>
            )}
            {!collapsed && !active && (
                <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(245,158,11,0.08)' }}
                />
            )}
        </Link>
    );
}

/** ─── Main AppShell ──────────────────────────────────────── */
export default function AppShell({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [userRole, setUserRole] = useState<Role>(null);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [notifications, setNotifications] = useState(0);

    // Track desktop/mobile breakpoint
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        setIsDesktop(mq.matches);
        const handler = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
            if (e.matches) setMobileOpen(false);
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const fetchUserProfile = useCallback(async (userId: string, userEmailFallback: string) => {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, is_active, email')
            .eq('id', userId)
            .single();
        if (profile) {
            setUserRole(profile.role as Role);
            setUserEmail(profile.email || userEmailFallback);
        }

        // Fetch unread notifications count
        const { count } = await supabase
            .from('app_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications(count || 0);
    }, []);

    useEffect(() => {
        let mounted = true;

        // Safety timeout: if auth check takes > 8s, stop spinning and redirect to login
        const safetyTimer = setTimeout(() => {
            if (mounted) {
                setLoading(false);
                setHasSession(false);
                if (pathname !== '/login') router.replace('/login');
            }
        }, 8000);

        const init = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!mounted) return;

                if (error) {
                    await supabase.auth.signOut().catch(() => { });
                    setHasSession(false);
                    if (pathname !== '/login') router.replace('/login');
                } else if (session) {
                    setHasSession(true);
                    setUserEmail(session.user.email || '');
                    try {
                        await fetchUserProfile(session.user.id, session.user.email || '');
                    } catch {
                        // Profile fetch failed — still allow access, role will be null
                    }
                } else {
                    setHasSession(false);
                    if (pathname !== '/login') router.replace('/login');
                }
            } catch {
                if (mounted) {
                    setHasSession(false);
                    if (pathname !== '/login') router.replace('/login');
                }
            } finally {
                clearTimeout(safetyTimer);
                if (mounted) setLoading(false);
            }
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_evt, session) => {
            if (!mounted) return;
            if (session) {
                setHasSession(true);
                try { await fetchUserProfile(session.user.id, session.user.email || ''); } catch { }
                if (pathname === '/login') router.replace('/admin');
            } else {
                setHasSession(false);
                setUserRole(null);
                if (pathname !== '/login') router.replace('/login');
            }
        });

        return () => { mounted = false; clearTimeout(safetyTimer); subscription.unsubscribe(); };
    }, [router, pathname, fetchUserProfile]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    // Loading spinner
    if (loading && pathname !== '/login') {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-app)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                        <BookOpen size={28} className="text-white" />
                    </div>
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Memuat...</p>
                </div>
            </div>
        );
    }

    if (!hasSession && pathname === '/login') return <>{children}</>;
    if (!hasSession) return null;

    const navItems = userRole ? (navByRole[userRole] || []) : [];
    const initials = userEmail ? userEmail[0].toUpperCase() : 'U';
    const sidebarWidth = collapsed ? '72px' : '256px';

    const roleLabel: Record<string, string> = {
        admin: 'Administrator', teacher: 'Pengajar',
        student: 'Murid', parent: 'Orang Tua'
    };

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
            {/* ── Mobile overlay ── */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* ── SIDEBAR ── */}
            <aside
                className="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 lg:relative"
                style={{
                    width: sidebarWidth,
                    background: 'var(--bg-sidebar)',
                    borderRight: '1px solid var(--border)',
                    transform: isDesktop ? 'none' : (mobileOpen ? 'translateX(0)' : 'translateX(-100%)'),
                }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    {!collapsed && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                <BookOpen size={16} className="text-white" />
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-dark)', lineHeight: 1 }}>Mingxian</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kursus App v2</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: 'var(--primary)' }}>
                            <BookOpen size={16} className="text-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden lg:flex p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                    <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
                        <X size={20} style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>

                {/* Role badge */}
                {!collapsed && (
                    <div className="px-4 py-2">
                        <span className="badge badge-amber text-[10px]">
                            {userRole ? roleLabel[userRole] : 'User'}
                        </span>
                    </div>
                )}

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                    {navItems.map(item => (
                        <NavItem
                            key={item.href}
                            {...item}
                            active={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))}
                            collapsed={collapsed}
                        />
                    ))}
                </nav>

                {/* User & Logout */}
                <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {!collapsed && (
                        <div className="flex items-center gap-2 px-2 py-2 mb-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)' }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}
                                    className="truncate">{userEmail}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-colors"
                        style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}
                        title="Keluar"
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Keluar</span>}
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Nav */}
                <header className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0"
                    style={{ background: 'white', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Mobile menu button */}
                    <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileOpen(true)}>
                        <Menu size={22} style={{ color: 'var(--text-muted)' }} />
                    </button>

                    {/* Page title */}
                    <div className="hidden lg:block">
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Notification bell */}
                        <Link href={userRole === 'admin' ? '/admin/notifikasi' : '#'} className="relative p-2 rounded-xl transition-colors"
                            style={{ background: 'var(--bg-secondary)' }}>
                            <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                            {notifications > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                                    style={{ background: 'var(--danger)', fontSize: '0.6rem', fontWeight: 700 }}>
                                    {notifications > 9 ? '9+' : notifications}
                                </span>
                            )}
                        </Link>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                            {initials}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
                    <div className="page-container animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
