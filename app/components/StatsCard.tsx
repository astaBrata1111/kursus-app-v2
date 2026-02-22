"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    iconBg?: string;
    trend?: number;       // percentage: +5 means +5%, -3 means -3%
    sub?: string;
    href?: string;
    gradient?: string;
}

export default function StatsCard({ label, value, icon, iconBg, trend, sub, gradient }: StatsCardProps) {
    const trendPositive = trend !== undefined && trend > 0;
    const trendNegative = trend !== undefined && trend < 0;

    return (
        <div className="card p-5 flex flex-col gap-3 hover-lift cursor-default" style={gradient ? { background: gradient } : undefined}>
            <div className="flex items-center justify-between">
                <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ background: iconBg || 'var(--primary)', color: 'white' }}
                >
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-1 text-xs font-bold"
                        style={{ color: trendPositive ? 'var(--success)' : trendNegative ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {trendPositive ? <TrendingUp size={14} /> : trendNegative ? <TrendingDown size={14} /> : <Minus size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </p>
                <p style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, marginTop: '0.125rem' }}>
                    {value}
                </p>
                {sub && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</p>
                )}
            </div>
        </div>
    );
}
