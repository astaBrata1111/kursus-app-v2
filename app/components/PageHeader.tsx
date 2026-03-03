import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    iconColor?: string;
    children?: ReactNode; // action slot
}

export default function PageHeader({
    title, subtitle, icon, iconColor = 'var(--primary)', children,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="flex items-center gap-2.5" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    {icon && (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ background: iconColor }}>
                            {icon}
                        </div>
                    )}
                    {title}
                </h1>
                {subtitle && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex flex-wrap gap-2 shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}
