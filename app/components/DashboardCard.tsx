"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
    label: string;
    value: string | number;
    icon?: ReactNode;
    health?: "green" | "amber" | "red" | "neutral";
    delta?: string;
    href?: string;
    loading?: boolean;
}

const healthStyles = {
    green: { border: 'var(--healthy)', bg: 'var(--healthy-bg)', text: 'var(--healthy)' },
    amber: { border: 'var(--warning)', bg: 'var(--warning-bg)', text: 'var(--warning)' },
    red: { border: 'var(--danger)', bg: 'var(--danger-bg)', text: 'var(--danger)' },
    neutral: { border: 'var(--border)', bg: 'var(--bg-secondary)', text: 'var(--text-muted)' },
};

export default function DashboardCard({
    label, value, icon, health = "neutral", delta, href, loading,
}: DashboardCardProps) {
    const h = healthStyles[health];

    const inner = (
        <div
            className="card p-5 flex flex-col gap-3 transition-all duration-200"
            style={{ borderLeft: `3px solid ${h.border}` }}
        >
            {loading ? (
                <>
                    <div className="h-3 w-24 skeleton rounded" />
                    <div className="h-8 w-16 skeleton rounded" />
                </>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                            {label}
                        </p>
                        {icon && (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: h.bg, color: h.text }}>
                                {icon}
                            </div>
                        )}
                    </div>
                    <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                        {value}
                    </p>
                    {delta && (
                        <p className="text-xs font-semibold" style={{ color: h.text }}>
                            {delta}
                        </p>
                    )}
                </>
            )}
        </div>
    );

    if (href) {
        return <a href={href} className="block hover:no-underline">{inner}</a>;
    }
    return inner;
}
