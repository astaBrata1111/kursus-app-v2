"use client";

import { X, Save } from "lucide-react";
import { useState, useEffect } from "react";
import ModalPortal from "./ModalPortal";

interface FieldDef {
    label: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'time' | 'date' | 'textarea' | 'days';
    options?: string[];
}

interface EditModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData: any;
    fields: FieldDef[];
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function EditModal({ title, isOpen, onClose, onSave, initialData, fields }: EditModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) setFormData({ ...initialData });
    }, [initialData]);

    if (!isOpen) return null;

    const handle = (name: string, val: any) =>
        setFormData((prev: any) => ({ ...prev, [name]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try { await onSave(formData); onClose(); }
        catch (err: any) { alert('Gagal menyimpan: ' + err.message); }
        finally { setLoading(false); }
    };

    const toggleDay = (day: string) => {
        const cur: string[] = formData.hari_kerja || [];
        handle('hari_kerja', cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day]);
    };

    return (
        <ModalPortal>
            <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <div className="modal-content max-h-[90vh] overflow-y-auto">
                    <div className="p-5 flex items-center justify-between" style={{ background: 'var(--primary)', color: 'white' }}>
                        <h2 style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
                        <button onClick={onClose} className="hover:rotate-90 transition-transform">
                            <X size={22} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {fields.map(f => (
                            <div key={f.name} className="space-y-1">
                                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    {f.label}
                                </label>

                                {f.type === 'select' && (
                                    <select className="input-base" value={formData[f.name] || ''} onChange={e => handle(f.name, e.target.value)}>
                                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                )}

                                {f.type === 'days' && (
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map(day => (
                                            <button key={day} type="button" onClick={() => toggleDay(day)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                                                style={{
                                                    background: (formData.hari_kerja || []).includes(day) ? 'var(--primary)' : 'var(--bg-secondary)',
                                                    color: (formData.hari_kerja || []).includes(day) ? 'white' : 'var(--text-muted)',
                                                    borderColor: (formData.hari_kerja || []).includes(day) ? 'var(--primary)' : 'var(--border)',
                                                }}>
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {f.type === 'textarea' && (
                                    <textarea className="input-base" rows={3}
                                        value={formData[f.name] || ''} onChange={e => handle(f.name, e.target.value)} />
                                )}

                                {!['select', 'days', 'textarea'].includes(f.type) && (
                                    <input className="input-base" type={f.type}
                                        value={formData[f.name] || ''} onChange={e => handle(f.name, e.target.value)} />
                                )}
                            </div>
                        ))}

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
                            <Save size={18} />
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
            </div>
        </ModalPortal>
    );
}
