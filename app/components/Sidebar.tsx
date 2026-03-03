"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, GraduationCap, Users, Home, Calendar, CreditCard,
    ClipboardList, UserCheck, BarChart2, Package, MessageSquare,
    TrendingUp, BookOpen, Settings, ChevronLeft, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "./SettingsProvider";

export type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | null;

interface NavItemDef {
    id: string;
    href: string;
    icon: ReactNode;
    label: string;
}

/* ─── Nav definitions per role ─────────────────────────────── */
const ownerNav: NavItemDef[] = [
    { id: 'dashboard', href: '/owner/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard Eksekutif' },
    { id: 'murid', href: '/admin/murid', icon: <Users size={20} />, label: 'Data Murid' },
    { id: 'jadwal', href: '/admin/jadwal', icon: <Calendar size={20} />, label: 'Jadwal' },
    { id: 'pengajar', href: '/admin/pengajar', icon: <GraduationCap size={20} />, label: 'Pengajar' },
    { id: 'ruangan', href: '/admin/ruangan', icon: <Home size={20} />, label: 'Ruangan' },
    { id: 'pembayaran', href: '/admin/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { id: 'absensi', href: '/admin/absensi', icon: <UserCheck size={20} />, label: 'Absensi' },
    { id: 'paket', href: '/admin/paket', icon: <Package size={20} />, label: 'Paket Kursus' },
    { id: 'trials', href: '/admin/trials', icon: <TrendingUp size={20} />, label: 'Trial Funnel' },
    { id: 'laporan', href: '/admin/laporan', icon: <BarChart2 size={20} />, label: 'Laporan' },
    { id: 'notifikasi', href: '/admin/notifikasi', icon: <MessageSquare size={20} />, label: 'Notifikasi WA' },
    { id: 'checklist', href: '/admin/checklist', icon: <ClipboardList size={20} />, label: 'Checklist Harian' },
    { id: 'settings', href: '/admin/settings', icon: <Settings size={20} />, label: 'Pengaturan' },
];

const adminNav: NavItemDef[] = [
    { id: 'dashboard', href: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'jadwal', href: '/admin/jadwal', icon: <Calendar size={20} />, label: 'Jadwal' },
    { id: 'murid', href: '/admin/murid', icon: <Users size={20} />, label: 'Data Murid' },
    { id: 'pengajar', href: '/admin/pengajar', icon: <GraduationCap size={20} />, label: 'Pengajar' },
    { id: 'ruangan', href: '/admin/ruangan', icon: <Home size={20} />, label: 'Ruangan' },
    { id: 'pembayaran', href: '/admin/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { id: 'absensi', href: '/admin/absensi', icon: <UserCheck size={20} />, label: 'Absensi' },
    { id: 'paket', href: '/admin/paket', icon: <Package size={20} />, label: 'Paket Kursus' },
    { id: 'trials', href: '/admin/trials', icon: <TrendingUp size={20} />, label: 'Trial Funnel' },
    { id: 'laporan', href: '/admin/laporan', icon: <BarChart2 size={20} />, label: 'Laporan' },
    { id: 'notifikasi', href: '/admin/notifikasi', icon: <MessageSquare size={20} />, label: 'Notifikasi WA' },
    { id: 'checklist', href: '/admin/checklist', icon: <ClipboardList size={20} />, label: 'Checklist Harian' },
];

const teacherNav: NavItemDef[] = [
    { id: 'dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'jadwal', href: '/teacher/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Mengajar' },
    { id: 'absensi', href: '/teacher/absensi', icon: <UserCheck size={20} />, label: 'Absensi Kelas' },
    { id: 'nilai', href: '/teacher/nilai', icon: <TrendingUp size={20} />, label: 'Nilai & Catatan' },
];

const studentNav: NavItemDef[] = [
    { id: 'dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'jadwal', href: '/student/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Kelas' },
    { id: 'pembayaran', href: '/student/pembayaran', icon: <CreditCard size={20} />, label: 'Pembayaran' },
    { id: 'absensi', href: '/student/absensi', icon: <UserCheck size={20} />, label: 'Absensi Saya' },
];

const parentNav: NavItemDef[] = [
    { id: 'dashboard', href: '/parent/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'jadwal', href: '/parent/jadwal', icon: <Calendar size={20} />, label: 'Jadwal Anak' },
    { id: 'pembayaran', href: '/parent/pembayaran', icon: <CreditCard size={20} />, label: 'Tagihan' },
    { id: 'absensi', href: '/parent/absensi', icon: <UserCheck size={20} />, label: 'Absensi Anak' },
    { id: 'laporan', href: '/parent/laporan', icon: <BookOpen size={20} />, label: 'Laporan Belajar' },
];

export const navByRole: Record<string, NavItemDef[]> = {
    owner: ownerNav, admin: adminNav,
    teacher: teacherNav, student: studentNav, parent: parentNav,
};

/* ─── Role display labels ───────────────────────────────────── */
export const roleLabel: Record<string, string> = {
    owner: 'Owner', admin: 'Administrator',
    teacher: 'Pengajar', student: 'Murid', parent: 'Orang Tua',
};

/* ─── Single nav item ───────────────────────────────────────── */
interface NavItemProps extends NavItemDef {
    active: boolean;
    collapsed: boolean;
}

export function NavItem({ href, icon, label, active, collapsed }: NavItemProps) {
    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group text-sm font-semibold",
                active
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-sidebar)] hover:bg-[rgba(100,100,100,0.08)]"
            )}
        >
            <span className={cn("shrink-0 transition-transform group-hover:scale-110", active && "text-white")}>
                {icon}
            </span>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
        </Link>
    );
}

/* ─── Sidebar component ─────────────────────────────────────── */
interface SidebarProps {
    role: Role;
    userEmail: string;
    collapsed: boolean;
    mobileOpen: boolean;
    isDesktop: boolean;
    onToggleCollapse: () => void;
    onCloseMobile: () => void;
    onLogout: () => void;
}

export default function Sidebar({
    role, userEmail, collapsed, mobileOpen, isDesktop,
    onToggleCollapse, onCloseMobile, onLogout,
}: SidebarProps) {
    const pathname = usePathname();
    const { settings, permissions, t } = useSettings();

    const baseNavItems = role ? (navByRole[role] ?? []) : [];
    const navItems = role === 'owner' ? baseNavItems : baseNavItems.filter(item => {
        const perm = permissions.find(p => p.role === role && p.module_id === item.id);
        return perm ? perm.is_allowed : true;
    });

    const initials = userEmail ? userEmail[0].toUpperCase() : 'U';
    const sidebarWidth = collapsed ? '72px' : '256px';

    return (
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
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                <BookOpen size={16} className="text-white" />
                            </div>
                        )}
                        <div>
                            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-dark)', lineHeight: 1 }}>
                                {settings?.app_name || 'Mingxian'}
                            </p>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-sidebar)', fontWeight: 600, opacity: 0.7 }}>GEO System</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="mx-auto">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                                <BookOpen size={16} className="text-white" />
                            </div>
                        )}
                    </div>
                )}
                <button onClick={onToggleCollapse} className="hidden lg:flex p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                    <ChevronLeft size={18} className={cn("transition-transform duration-300", collapsed && "rotate-180")} />
                </button>
                <button className="lg:hidden" onClick={onCloseMobile}>
                    <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
            </div>

            {/* Role badge */}
            {!collapsed && role && (
                <div className="px-4 py-2">
                    <span className="badge badge-amber text-[10px]">{t(`role_${role}`) || roleLabel[role]}</span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {navItems.map(item => {
                    // Try to construct a key for dynamic translation, fallback to original label if key not defined.
                    // For example: 'nav_data_murid' for 'Data Murid', or just map from dict directly.
                    // Simplest is comparing labels using direct known maps or extending dictionary. 
                    // To handle all dynamically, we prefer using `nav_${item.id}` if we matched IDs properly.
                    // Based on i18n.ts, ids like 'dashboard', 'murid', 'jadwal' match correctly with 'nav_' prefix.
                    // Let's use custom overrides for specific links or just check if `t('nav_' + item.id)` exists.
                    let labelKey = `nav_${item.id}`;
                    if (role === 'owner' && item.id === 'dashboard') labelKey = 'nav_dashboard_eksekutif';
                    if (role === 'teacher' && item.id === 'jadwal') labelKey = 'nav_jadwal_mengajar';
                    if (role === 'teacher' && item.id === 'absensi') labelKey = 'nav_absensi_kelas';
                    if (role === 'student' && item.id === 'jadwal') labelKey = 'nav_jadwal_kelas';
                    if (role === 'student' && item.id === 'absensi') labelKey = 'nav_absensi_saya';
                    if (role === 'parent' && item.id === 'jadwal') labelKey = 'nav_jadwal_anak';
                    if (role === 'parent' && item.id === 'absensi') labelKey = 'nav_absensi_anak';

                    const translatedLabel = t(labelKey);

                    return (
                        <NavItem
                            key={item.href}
                            {...item}
                            label={translatedLabel !== labelKey ? translatedLabel : item.label}
                            active={
                                pathname === item.href ||
                                (item.href !== '/admin' && item.href !== '/owner/dashboard' && pathname.startsWith(item.href))
                            }
                            collapsed={collapsed}
                        />
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                {!collapsed && (
                    <div className="flex items-center gap-2 px-2 py-2 mb-2 rounded-xl" style={{ background: 'rgba(100,100,100,0.06)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ background: 'var(--primary)' }}>
                            {initials}
                        </div>
                        <p className="truncate text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{userEmail}</p>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-colors text-sm font-semibold"
                    style={{ color: 'var(--danger)' }}
                    title="Keluar"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    {!collapsed && <span>Keluar</span>}
                </button>
            </div>
        </aside>
    );
}

