import { cn } from "@/lib/utils";

export type StudentStatus = 'active' | 'trial' | 'at_risk' | 'dropped';

interface StatusBadgeProps {
    status: StudentStatus;
    className?: string;
}

const statusConfig: Record<StudentStatus, { label: string; dot: string }> = {
    active: { label: 'Aktif', dot: 'bg-[var(--status-active-color)]' },
    trial: { label: 'Trial', dot: 'bg-[var(--status-trial-color)]' },
    at_risk: { label: 'Perlu Perhatian', dot: 'bg-[var(--status-at-risk-color)]' },
    dropped: { label: 'Non-aktif', dot: 'bg-[var(--status-dropped-color)]' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const cfg = statusConfig[status] ?? statusConfig.active;

    return (
        <span
            className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide', className)}
            style={{
                background: `var(--status-${status.replace('_', '-')}-bg, var(--bg-secondary))`,
                color: `var(--status-${status.replace('_', '-')}-color, var(--text-muted))`,
                transition: 'background 250ms ease-in-out, color 250ms ease-in-out',
            }}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
            {cfg.label}
        </span>
    );
}
