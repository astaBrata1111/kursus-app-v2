"use client";

import type { ReactNode } from "react";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar, { type Role } from "./Sidebar";
import TopNav from "./TopNav";

/* Role → home page mapping */
const roleHome: Record<string, string> = {
    owner: '/owner/dashboard',
    admin: '/admin',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard',
};

export default function AppShell({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [userRole, setUserRole] = useState<Role>(null);
    const [userEmail, setUserEmail] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [notifications, setNotifications] = useState(0);

    // ── Responsive breakpoint ────────────────────────────────
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

    // ── Fetch profile + unread notifications ─────────────────
    const fetchUserProfile = useCallback(async (userId: string, emailFallback: string) => {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('role, is_active, email')
            .eq('id', userId)
            .single();

        if (profile) {
            setUserRole(profile.role as Role);
            setUserEmail(profile.email || emailFallback);
        }

        const { count } = await supabase
            .from('app_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications(count || 0);
    }, []);

    // ── Auth init + listener ─────────────────────────────────
    // IMPORTANT: This effect must run ONCE on mount only.
    // We use a ref to read the current pathname inside async callbacks
    // to avoid stale closures without re-subscribing on every navigation.
    const pathnameRef = React.useRef(pathname);
    pathnameRef.current = pathname; // keep ref fresh on every render

    useEffect(() => {
        let mounted = true;

        const safetyTimer = setTimeout(() => {
            if (mounted) {
                setLoading(false);
                setHasSession(false);
                if (pathnameRef.current !== '/login') router.replace('/login');
            }
        }, 8000);

        const init = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!mounted) return;

                if (error) {
                    await supabase.auth.signOut().catch(() => { });
                    setHasSession(false);
                    if (pathnameRef.current !== '/login') router.replace('/login');
                } else if (session) {
                    setHasSession(true);
                    setUserEmail(session.user.email || '');
                    try { await fetchUserProfile(session.user.id, session.user.email || ''); } catch { }
                } else {
                    setHasSession(false);
                    if (pathnameRef.current !== '/login') router.replace('/login');
                }
            } catch {
                if (mounted) {
                    setHasSession(false);
                    if (pathnameRef.current !== '/login') router.replace('/login');
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
                let role: Role = null;
                try {
                    const { data: profile } = await supabase
                        .from('user_profiles').select('role, is_active, email').eq('id', session.user.id).single();
                    if (profile) {
                        role = profile.role as Role;
                        setUserRole(role);
                        setUserEmail(profile.email || session.user.email || '');
                    }
                } catch { }
                // Only redirect when coming FROM /login — never redirect mid-session navigation
                if (pathnameRef.current === '/login') {
                    router.replace(role ? (roleHome[role] ?? '/admin') : '/admin');
                }
            } else {
                setHasSession(false);
                setUserRole(null);
                if (pathnameRef.current !== '/login') router.replace('/login');
            }
        });

        return () => { mounted = false; clearTimeout(safetyTimer); subscription.unsubscribe(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ← mount-only: pathnameRef keeps the value fresh without re-subscribing

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/login');
    };

    // ── Loading spinner ──────────────────────────────────────
    if (loading && pathname !== '/login') {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-app)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                    </div>
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>Memuat...</p>
                </div>
            </div>
        );
    }

    if (!hasSession && pathname === '/login') return <>{children}</>;
    if (!hasSession) return null;

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Sidebar */}
            <Sidebar
                role={userRole}
                userEmail={userEmail}
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                isDesktop={isDesktop}
                onToggleCollapse={() => setCollapsed(c => !c)}
                onCloseMobile={() => setMobileOpen(false)}
                onLogout={handleLogout}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNav
                    role={userRole}
                    notifications={notifications}
                    onMobileMenuOpen={() => setMobileOpen(true)}
                />
                <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-app)' }}>
                    <div className="page-container animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
