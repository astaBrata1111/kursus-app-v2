"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSettings, ThemeType, LanguageType, RolePermission } from "@/app/components/SettingsProvider";
import { Save, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const { settings, permissions, loading: contextLoading, refreshSettings } = useSettings();
    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'roles'>('general');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [appName, setAppName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [theme, setTheme] = useState<ThemeType>('default');
    const [language, setLanguage] = useState<LanguageType>('id');
    const [trialExpiry, setTrialExpiry] = useState(14);
    const [rolePerms, setRolePerms] = useState<Record<string, Record<string, boolean>>>({});
    const [uploading, setUploading] = useState(false);

    // Initialize state when context loads
    useEffect(() => {
        if (!contextLoading && settings) {
            setAppName(settings.app_name);
            setLogoUrl(settings.logo_url || '');
            setTheme(settings.theme);
            setLanguage(settings.language);
            setTrialExpiry(settings.trial_expiry_days);

            // Reconstruct permissions into a mutable map: role -> moduleId -> is_allowed
            const permMap: Record<string, Record<string, boolean>> = {};
            permissions.forEach(p => {
                if (!permMap[p.role]) permMap[p.role] = {};
                permMap[p.role][p.module_id] = p.is_allowed;
            });
            setRolePerms(permMap);
        }
    }, [contextLoading, settings, permissions]);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // Resusing avatars bucket or default public bucket
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setLogoUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage({ type: 'error', text: 'Gagal mengunggah logo.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // 1. Update System Settings
            const { error: sysError } = await supabase
                .from('system_settings')
                .update({
                    app_name: appName,
                    logo_url: logoUrl || null,
                    theme,
                    language,
                    trial_expiry_days: trialExpiry
                })
                .eq('id', 1);

            if (sysError) throw sysError;

            // 2. Update Role Permissions (Upsert)
            const upsertData: any[] = [];
            Object.entries(rolePerms).forEach(([roleName, modules]) => {
                Object.entries(modules).forEach(([moduleId, isAllowed]) => {
                    upsertData.push({ role: roleName, module_id: moduleId, is_allowed: isAllowed });
                });
            });

            if (upsertData.length > 0) {
                const { error: roleError } = await supabase
                    .from('role_permissions')
                    .upsert(upsertData, { onConflict: 'role,module_id' });
                if (roleError) throw roleError;
            }

            await refreshSettings();
            setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });

            // Re-render entirely to apply global theme changes smoothly
            if (settings?.theme !== theme) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan pengaturan.' });
        } finally {
            setSaving(false);
        }
    };

    const togglePermission = (r: string, m: string) => {
        setRolePerms(prev => ({
            ...prev,
            [r]: {
                ...(prev[r] || {}),
                [m]: !(prev[r]?.[m])
            }
        }));
    };

    if (contextLoading) {
        return <div className="p-6 text-center text-sm text-[var(--text-muted)]">Memuat Pengaturan...</div>;
    }

    const availableModules = ['dashboard', 'murid', 'pengajar', 'jadwal', 'kelas', 'ruangan', 'pembayaran', 'absensi', 'paket', 'trials', 'laporan', 'notifikasi', 'checklist', 'nilai', 'materi', 'tagihan', 'progress'];

    return (
        <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Pengaturan Sistem</h1>
                    <p className="text-sm text-[var(--text-muted)]">Kelola preferensi, tampilan, dan akses peran aplikasi.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                >
                    {saving ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${message.type === 'success' ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--danger-bg)] text-[var(--danger)]'}`}>
                    {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {message.text}
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="flex border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
                    {(['general', 'appearance', 'roles'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab ? 'border-[var(--primary)] text-[var(--primary-dark)] bg-white' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        >
                            {tab === 'general' ? 'Umum' : tab === 'appearance' ? 'Tampilan & Tema' : 'Hak Akses Peran'}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {/* ─── GENERAL TAB ─── */}
                    {activeTab === 'general' && (
                        <div className="space-y-6 max-w-xl animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Nama Aplikasi</label>
                                <input
                                    type="text"
                                    className="input-base"
                                    value={appName}
                                    onChange={e => setAppName(e.target.value)}
                                    placeholder="Contoh: Mingxian Center"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1.5">Akan ditampilkan di sidebar dan judul tab browser.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Bahasa Utama</label>
                                <select
                                    className="input-base"
                                    value={language}
                                    onChange={e => setLanguage(e.target.value as LanguageType)}
                                >
                                    <option value="id">Bahasa Indonesia</option>
                                    <option value="en">English</option>
                                    <option value="zh">中文 (Mandarin)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Batas Waktu Kedaluwarsa Trial (Hari)</label>
                                <input
                                    type="number"
                                    className="input-base"
                                    value={trialExpiry}
                                    onChange={e => setTrialExpiry(parseInt(e.target.value) || 14)}
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1.5">Jumlah hari maksimum untuk menindaklanjuti calon murid trial.</p>
                            </div>
                        </div>
                    )}

                    {/* ─── APPEARANCE TAB ─── */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-8 max-w-2xl animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-3">Logo Institusi</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={24} className="text-[var(--text-light)]" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <label className="btn-ghost text-xs py-2 px-4 cursor-pointer">
                                                {uploading ? 'Mengunggah...' : 'Pilih Gambar'}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                                            </label>
                                            {logoUrl && (
                                                <button onClick={() => setLogoUrl('')} className="text-xs font-semibold text-[var(--danger)] hover:underline">
                                                    Hapus
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">Format: JPG, PNG, atau SVG. Rasio 1:1 disarankan.</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-[var(--border-light)]" />

                            <div>
                                <label className="block text-sm font-bold text-[var(--text-primary)] mb-4">Tema Warna</label>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Default Theme Option */}
                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === 'default' ? 'border-amber-500 bg-amber-50/50' : 'border-[var(--border-light)] hover:border-amber-200'}`}
                                        onClick={() => setTheme('default')}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-sm text-stone-800">Classic Amber</h3>
                                            {theme === 'default' && <CheckCircle className="text-amber-500" size={18} />}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#F59E0B]"></div>
                                            <div className="w-6 h-6 rounded-full bg-[#16A34A]"></div>
                                            <div className="w-6 h-6 rounded-full bg-[#DC2626]"></div>
                                        </div>
                                        <p className="text-xs text-stone-500 mt-3">Skema warna hangat yang ceria.</p>
                                    </div>

                                    {/* GEO Theme Option */}
                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${theme === 'geo' ? 'border-[#4A6FA5] bg-[#4A6FA5]/5' : 'border-[var(--border-light)] hover:border-[#4A6FA5]/30'}`}
                                        onClick={() => setTheme('geo')}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-sm text-[#1E2A3A]">GEO Elegance</h3>
                                            {theme === 'geo' && <CheckCircle className="text-[#4A6FA5]" size={18} />}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#4A6FA5]"></div>
                                            <div className="w-6 h-6 rounded-full bg-[#6FA67A]"></div>
                                            <div className="w-6 h-6 rounded-full bg-[#D66A6A]"></div>
                                        </div>
                                        <p className="text-xs text-stone-500 mt-3">Desain profesional dengan palet warna tenang (Slate Blue & Sage).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── ROLE PERMISSIONS TAB ─── */}
                    {activeTab === 'roles' && (
                        <div className="animate-fade-in">
                            <div className="mb-6">
                                <p className="text-sm text-[var(--text-muted)]">Atur modul apa saja yang dapat diakses oleh masing-masing peran di sidebar. <br className="hidden sm:block" />(Peran Owner memiliki akses penuh ke semua modul secara permanen).</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-base w-full whitespace-nowrap">
                                    <thead>
                                        <tr>
                                            <th>Modul</th>
                                            <th className="text-center">Admin</th>
                                            <th className="text-center">Pengajar</th>
                                            <th className="text-center">Murid</th>
                                            <th className="text-center">Wali Murid</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availableModules.map(mod => (
                                            <tr key={mod}>
                                                <td className="font-medium capitalize">{mod.replace('-', ' ')}</td>
                                                {['admin', 'teacher', 'student', 'parent'].map(role => {
                                                    const isChecked = rolePerms[role]?.[mod] || false;
                                                    return (
                                                        <td key={`${role}-${mod}`} className="text-center">
                                                            <div className="inline-flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => togglePermission(role, mod)}
                                                                    className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary-glow)] cursor-pointer"
                                                                />
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
