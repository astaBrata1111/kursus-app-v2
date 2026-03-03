"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTranslation } from "@/lib/i18n";

export type ThemeType = "default" | "geo";
export type LanguageType = "id" | "en" | "zh";

export interface SystemSettings {
    app_name: string;
    logo_url: string | null;
    theme: ThemeType;
    language: LanguageType;
    trial_expiry_days: number;
}

export interface RolePermission {
    role: string;
    module_id: string;
    is_allowed: boolean;
}

interface SettingsContextData {
    settings: SystemSettings | null;
    permissions: RolePermission[];
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
    app_name: "Mingxian Center",
    logo_url: null,
    theme: "default",
    language: "id",
    trial_expiry_days: 14,
};

const SettingsContext = createContext<SettingsContextData>({
    settings: defaultSettings,
    permissions: [],
    loading: true,
    refreshSettings: async () => { },
});

export const useSettings = () => {
    const context = useContext(SettingsContext);

    // Create an inline translation helper based on the current language
    const t = (key: string) => {
        const lang = context.settings?.language || "id";
        return getTranslation(lang, key);
    };

    return { ...context, t };
};
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        setLoading(true);
        try {
            // Fetch System Settings
            const { data: setts } = await supabase
                .from('system_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (setts) {
                setSettings(setts);
            } else {
                setSettings(defaultSettings);
            }

            // Fetch Role Permissions
            const { data: perms } = await supabase
                .from('role_permissions')
                .select('*');

            if (perms) {
                setPermissions(perms);
            }
        } catch (error) {
            console.error("Error fetching settings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    // Apply document title
    useEffect(() => {
        if (settings?.app_name) {
            document.title = `${settings.app_name} — Sistem Manajemen Kursus`;
        }
    }, [settings?.app_name]);

    return (
        <SettingsContext.Provider value={{ settings, permissions, loading, refreshSettings }}>
            {/* Dynamic Theme Injection */}
            {settings?.theme === 'geo' && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        --primary: #4A6FA5;
                        --primary-dark: #375480;
                        --primary-light: #7E9DC7;
                        --primary-glow: rgba(74, 111, 165, 0.25);
                        
                        --bg-app: #F7F9FB;
                        --bg-sidebar: #EBF0F5;
                        --bg-card: #FFFFFF;
                        --bg-secondary: #F0F4F8;
                        
                        --text-primary: #1E2A3A;
                        --text-muted: #7A8FA6;
                        --text-light: #A1B3C4;
                        --text-sidebar: #2C4263;
                        --text-on-amber: #FFFFFF;
                        
                        --border: #C8D6E5;
                        --border-light: #E2EBF2;
                        
                        --success: #6FA67A;
                        --success-bg: #F0F7F1;
                        
                        --danger: #D66A6A;
                        --danger-bg: #FDF3F3;
                        
                        --warning: #E5B65C;
                        --warning-bg: #FEF9EE;
                        
                        --healthy: #6FA67A;
                        --healthy-bg: #F0F7F1;
                        
                        --info: #4A6FA5;
                        --info-bg: #F0F4F8;
                    }
                    /* Override buttons to avoid amber specific classes */
                    .card-amber {
                        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
                        box-shadow: 0 8px 24px var(--primary-glow);
                    }
                    .badge-amber {
                        background: var(--warning-bg);
                        color: var(--warning);
                    }
                    .gradient-amber {
                        background: linear-gradient(135deg, var(--bg-sidebar), var(--border-light));
                    }
                `}} />
            )}
            {children}
        </SettingsContext.Provider>
    );
}
