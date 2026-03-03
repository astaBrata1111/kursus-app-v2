"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AttendanceToggleProps {
    value: "hadir" | "alpha" | "izin" | "sakit";
    onChange: (val: "hadir" | "alpha" | "izin" | "sakit") => void;
    disabled?: boolean;
}

const OPTIONS = [
    { key: "hadir", label: "Hadir", color: 'var(--success)', bg: 'var(--success-bg)' },
    { key: "alpha", label: "Alpha", color: 'var(--danger)', bg: 'var(--danger-bg)' },
    { key: "izin", label: "Izin", color: 'var(--info)', bg: 'var(--info-bg)' },
    { key: "sakit", label: "Sakit", color: 'var(--warning)', bg: 'var(--warning-bg)' },
] as const;

export default function AttendanceToggle({ value, onChange, disabled }: AttendanceToggleProps) {
    const [pressing, setPressing] = useState<string | null>(null);

    return (
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {OPTIONS.map(opt => {
                const active = value === opt.key;
                return (
                    <button
                        key={opt.key}
                        type="button"
                        disabled={disabled}
                        onMouseDown={() => setPressing(opt.key)}
                        onMouseUp={() => setPressing(null)}
                        onMouseLeave={() => setPressing(null)}
                        onClick={() => onChange(opt.key)}
                        className="flex-1 px-2 py-1.5 text-[0.65rem] font-bold uppercase tracking-wide transition-all"
                        style={{
                            background: active ? opt.color : (pressing === opt.key ? opt.bg : 'white'),
                            color: active ? 'white' : (pressing === opt.key ? opt.color : 'var(--text-muted)'),
                            transform: pressing === opt.key ? 'scale(0.96)' : 'scale(1)',
                            transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', // spring
                            borderRight: '1px solid var(--border)',
                        }}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
