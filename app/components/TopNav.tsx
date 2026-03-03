"use client";

import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import type { Role } from "./Sidebar";
import { useSettings } from "./SettingsProvider";

interface TopNavProps {
    role: Role;
    notifications: number;
    onMobileMenuOpen: () => void;
}

export default function TopNav({ role, notifications, onMobileMenuOpen }: TopNavProps) {
    const { settings } = useSettings();
    const locale = settings?.language === 'zh' ? 'zh-CN' : settings?.language === 'en' ? 'en-US' : 'id-ID';
    const today = new Date().toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <header
            className="h-16 flex items-center justify-between px-4 lg:px-6 shrink-0"
            style={{ background: 'white', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
            {/* Mobile menu trigger */}
            <button className="lg:hidden p-2 rounded-lg" onClick={onMobileMenuOpen}>
                <Menu size={22} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Date display */}
            <p className="hidden lg:block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {today}
            </p>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-auto">
                {/* Notification bell */}
                <Link
                    href={role === 'admin' || role === 'owner' ? '/admin/notifikasi' : '#'}
                    className="relative p-2 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-secondary)' }}
                >
                    <Bell size={20} style={{ color: 'var(--text-muted)' }} />
                    {notifications > 0 && (
                        <span
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                            style={{ background: 'var(--danger)', fontSize: '0.6rem', fontWeight: 700 }}
                        >
                            {notifications > 9 ? '9+' : notifications}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
