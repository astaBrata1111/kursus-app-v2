"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Plus, Search, UserPlus, CalendarCheck, CheckCircle2, XCircle,
    TrendingUp, Users, ArrowRight, Phone, X, Save
} from "lucide-react";

interface Trial {
    id: string;
    student_name: string;
    parent_name?: string;
    email?: string;
    phone?: string;
    source?: string;
    status: "inquiry" | "scheduled" | "attended" | "converted" | "lost";
    trial_date?: string;
    notes?: string;
    created_at: string;
}

const STATUSES = ["inquiry", "scheduled", "attended", "converted", "lost"] as const;
type TrialStatus = (typeof STATUSES)[number];

const STATUS_META: Record<TrialStatus, { label: string; color: string; icon: React.ReactNode }> = {
    inquiry: { label: "Inquiry", color: "bg-primary/15 text-primary", icon: <UserPlus className="w-3.5 h-3.5" /> },
    scheduled: { label: "Scheduled", color: "bg-status-warning/20 status-warning", icon: <CalendarCheck className="w-3.5 h-3.5" /> },
    attended: { label: "Attended", color: "bg-accent text-accent-foreground", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    converted: { label: "Converted", color: "bg-status-healthy/20 status-healthy", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    lost: { label: "Lost", color: "bg-status-risk/20 status-risk", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const SOURCES = ["Walk-in", "Referral", "Social Media", "Website", "WeChat", "WhatsApp", "Other"];

/* ---------- Metrics Card ---------- */
function MetricCard({ label, value, icon, subtitle }: { label: string; value: string | number; icon: React.ReactNode; subtitle?: string }) {
    return (
        <div className="card p-5 animate-fade-in" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
                </div>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>{icon}</div>
            </div>
        </div>
    );
}

/* ---------- Status Badge ---------- */
function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status as TrialStatus] ?? STATUS_META.inquiry;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold badge`} style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-sidebar)',
            border: '1px solid var(--border)'
        }}>
            {meta.icon} {meta.label}
        </span>
    );
}

/* ---------- Pipeline Column ---------- */
function PipelineColumn({ status, trials, onSelect }: { status: TrialStatus; trials: Trial[]; onSelect: (t: Trial) => void }) {
    const meta = STATUS_META[status];
    return (
        <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 mb-3 px-1">
                <StatusBadge status={status} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{trials.length}</span>
            </div>
            <div className="space-y-3">
                {trials.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelect(t)}
                        className="card p-4 w-full text-left hover:border-primary transition-all cursor-pointer group shadow-sm"
                    >
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{t.student_name}</p>
                        {t.parent_name && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.parent_name}</p>}
                        {t.trial_date && <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>📅 {t.trial_date}</p>}
                        {t.source && (
                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-lg border" style={{ background: 'var(--bg-app)', color: 'var(--text-muted)', borderColor: 'var(--border-light)' }}>{t.source}</span>
                        )}
                    </button>
                ))}
                {trials.length === 0 && (
                    <div className="card-dashed p-10 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border-light)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-light)' }}>Belum ada data</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------- Main Page ---------- */
export default function TrialsPage() {
    const [trials, setTrials] = useState<Trial[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTrial, setEditTrial] = useState<Trial | null>(null);
    const [view, setView] = useState<"pipeline" | "list">("pipeline");

    // Form State
    const [formData, setFormData] = useState<Partial<Trial>>({
        student_name: "",
        parent_name: "",
        email: "",
        phone: "",
        source: "Walk-in",
        status: "inquiry",
        trial_date: "",
        notes: "",
    });

    const fetchTrials = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("trials")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTrials((data as Trial[]) || []);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrials();
    }, []);

    const filtered = (trials || []).filter((t) => {
        if (!t || !t.student_name) return false;
        const matchSearch =
            t.student_name.toLowerCase().includes(search.toLowerCase()) ||
            (t.parent_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchStatus = filterStatus === "all" || t.status === filterStatus;
        return matchSearch && matchStatus;
    });

    // Metrics
    const trialsList = trials || [];
    const total = trialsList.length;
    const inquiries = trialsList.filter((t) => t.status === "inquiry").length;
    const converted = trialsList.filter((t) => t.status === "converted").length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const scheduled = trialsList.filter((t) => t.status === "scheduled").length;

    const openAdd = () => {
        setEditTrial(null);
        setFormData({
            student_name: "",
            parent_name: "",
            email: "",
            phone: "",
            source: "Walk-in",
            status: "inquiry",
            trial_date: "",
            notes: "",
        });
        setDialogOpen(true);
    };

    const openEdit = (t: Trial) => {
        setEditTrial(t);
        setFormData({
            student_name: t.student_name,
            parent_name: t.parent_name || "",
            email: t.email || "",
            phone: t.phone || "",
            source: t.source || "Walk-in",
            status: t.status,
            trial_date: t.trial_date || "",
            notes: t.notes || "",
        });
        setDialogOpen(true);
    };

    const closeModal = () => {
        setDialogOpen(false);
        setEditTrial(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.student_name) return alert("Nama murid wajib diisi");

        setLoading(true);
        try {
            if (editTrial) {
                const { error } = await supabase.from("trials").update(formData).eq("id", editTrial.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("trials").insert([formData]);
                if (error) throw error;
            }
            closeModal();
            fetchTrials();
        } catch (err: any) {
            console.error(err);
            alert("Gagal menyimpan data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="flex items-center gap-2" style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--primary)' }}>
                            <TrendingUp size={22} />
                        </div>
                        Trial Funnel
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track inquiries from first contact to conversion.</p>
                </div>
                <button onClick={openAdd} className="btn-primary gap-1.5">
                    <Plus className="w-4 h-4" /> New Inquiry
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton" />)
                ) : (
                    <>
                        <MetricCard label="Total Inquiries" value={total} icon={<Users className="w-4 h-4" />} />
                        <MetricCard label="Pending Inquiries" value={inquiries} icon={<UserPlus className="w-4 h-4" />} subtitle="Awaiting follow-up" />
                        <MetricCard label="Scheduled" value={scheduled} icon={<CalendarCheck className="w-4 h-4" />} subtitle="Upcoming trials" />
                        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} icon={<TrendingUp className="w-4 h-4" />} subtitle={`${converted} of ${total} converted`} />
                    </>
                )}
            </div>

            {/* Funnel visual */}
            <div className="card p-4 overflow-x-auto">
                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {STATUSES.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <span className="whitespace-nowrap flex items-center gap-1 font-bold" style={{ color: filterStatus === s ? 'var(--primary-dark)' : 'inherit' }}>
                                <StatusBadge status={s} />
                            </span>
                            {i < STATUSES.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/30" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                        placeholder="Search by student or parent name…"
                        className="input-base pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="input-base w-full sm:w-44"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                </select>
                <div className="flex gap-1 border rounded-xl p-1" style={{ borderColor: 'var(--border)' }}>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'pipeline' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
                        onClick={() => setView("pipeline")}
                    >
                        Pipeline
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'}`}
                        onClick={() => setView("list")}
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Pipeline View */}
            {view === "pipeline" && (
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {STATUSES.map((s) => (
                        <PipelineColumn
                            key={s}
                            status={s}
                            trials={filtered.filter((t) => t.status === s)}
                            onSelect={openEdit}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {view === "list" && (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table-base">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Parent</th>
                                    <th>Status</th>
                                    <th>Source</th>
                                    <th>Trial Date</th>
                                    <th className="text-right">Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}><td colSpan={6} className="p-3"><div className="skeleton h-8 w-full" /></td></tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>No trials found</td></tr>
                                ) : (
                                    filtered.map((t) => (
                                        <tr key={t.id} className="hover:bg-muted/10 cursor-pointer" onClick={() => openEdit(t)}>
                                            <td className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.student_name}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{t.parent_name ?? "—"}</td>
                                            <td><StatusBadge status={t.status} /></td>
                                            <td style={{ color: 'var(--text-muted)' }}>{t.source ?? "—"}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{t.trial_date ?? "—"}</td>
                                            <td className="text-right">
                                                {t.phone && (
                                                    <a
                                                        href={`https://wa.me/${t.phone.replace(/\D/g, "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-xs font-bold"
                                                        style={{ color: 'var(--info)' }}
                                                    >
                                                        <Phone className="w-3 h-3" /> WhatsApp
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Dialog Modal */}
            {dialogOpen && (
                <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div className="modal-content">
                        <div className="p-5 flex items-center justify-between" style={{ background: 'var(--primary)', color: 'white' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                                {editTrial ? "Edit Trial" : "New Inquiry"}
                            </h2>
                            <button onClick={closeModal} className="hover:rotate-90 transition-transform"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Student Name *</label>
                                    <input
                                        required
                                        className="input-base"
                                        value={formData.student_name}
                                        onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Parent Name</label>
                                    <input
                                        className="input-base"
                                        value={formData.parent_name}
                                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Email</label>
                                    <input
                                        type="email"
                                        className="input-base"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Phone (WhatsApp)</label>
                                    <input
                                        className="input-base"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Source</label>
                                    <select
                                        className="input-base"
                                        value={formData.source}
                                        onChange={(v) => setFormData({ ...formData, source: v.target.value })}
                                    >
                                        {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Trial Date</label>
                                    <input
                                        type="date"
                                        className="input-base"
                                        value={formData.trial_date}
                                        onChange={(e) => setFormData({ ...formData, trial_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Status</label>
                                <select
                                    className="input-base"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TrialStatus })}
                                >
                                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Notes</label>
                                <textarea
                                    className="input-base"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary">
                                    <Save size={16} /> {loading ? "Saving..." : editTrial ? "Update" : "Add Inquiry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
