'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod/v4';
import { motion, AnimatePresence } from 'motion/react';
import {
    User, Users, BookOpen, HeartPulse, CheckCircle2, ChevronRight, ChevronLeft,
    Calendar, MapPin, School, Briefcase, Phone, Mail, Clock, Shirt, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/* ─── Schema ──────────────────────────────────────────────────── */
const formSchema = z.object({
    // Student
    namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
    namaPanggilan: z.string().min(1, 'Nama panggilan wajib diisi'),
    jenisKelamin: z.string().min(1, 'Pilih jenis kelamin'),
    tanggalLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
    usia: z.string().min(1, 'Usia wajib diisi'),
    domisili: z.string().min(5, 'Domisili minimal 5 karakter'),
    sekolahAsal: z.string().min(1, 'Sekolah asal wajib diisi'),
    kelasGrade: z.string().min(1, 'Kelas/Grade wajib diisi'),
    // Parent
    namaOrangTua: z.string().min(3, 'Nama orang tua minimal 3 karakter'),
    pekerjaanOrangTua: z.string().min(1, 'Pekerjaan wajib diisi'),
    noWhatsapp: z.string().min(10, 'Nomor WhatsApp minimal 10 digit'),
    email: z.string().email('Email tidak valid'),
    // Emergency
    kontakDaruratNama: z.string().min(1, 'Nama kontak darurat wajib diisi'),
    kontakDaruratHubungan: z.string().min(1, 'Hubungan wajib diisi'),
    kontakDaruratNo: z.string().min(10, 'Nomor darurat minimal 10 digit'),
    // Program
    programLes: z.string().min(1, 'Pilih program les'),
    hariJamBelajar: z.string().min(1, 'Isi hari & jam belajar'),
    sumberInformasi: z.string().min(1, 'Pilih sumber informasi'),
    // Additional (optional)
    riwayatKesehatan: z.string().optional(),
    alergi: z.string().optional(),
    hobiMinat: z.string().optional(),
    ukuranBajuDewasa: z.string().optional(),
    ukuranBajuAnak: z.string().optional(),
    // Consent
    persetujuan: z.boolean().refine(v => v === true, 'Anda harus menyetujui syarat dan ketentuan'),
});

type FormData = z.infer<typeof formSchema>;

/* ─── Steps ───────────────────────────────────────────────────── */
const steps = [
    { id: 'student', title: 'Data Anak', icon: User },
    { id: 'parent', title: 'Data Orang Tua', icon: Users },
    { id: 'program', title: 'Program & Jadwal', icon: BookOpen },
    { id: 'additional', title: 'Info Tambahan', icon: HeartPulse },
    { id: 'consent', title: 'Persetujuan', icon: ShieldCheck },
];

const getFieldsForStep = (step: number) => {
    switch (step) {
        case 0: return ['namaLengkap', 'namaPanggilan', 'jenisKelamin', 'tanggalLahir', 'usia', 'domisili', 'sekolahAsal', 'kelasGrade'] as const;
        case 1: return ['namaOrangTua', 'pekerjaanOrangTua', 'noWhatsapp', 'email', 'kontakDaruratNama', 'kontakDaruratHubungan', 'kontakDaruratNo'] as const;
        case 2: return ['programLes', 'hariJamBelajar', 'sumberInformasi'] as const;
        case 3: return [] as const;
        case 4: return ['persetujuan'] as const;
        default: return [] as const;
    }
};

/* ─── Shared input style ──────────────────────────────────────── */
const inp = (err?: boolean) =>
    cn('w-full px-4 py-3 rounded-xl text-sm border transition-all outline-none',
        'focus:ring-2',
        err
            ? 'border-[var(--danger)] bg-[var(--danger-bg)] focus:ring-[var(--danger)]/20'
            : 'bg-stone-50 border-stone-200 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]'
    );

/* ─── Page ────────────────────────────────────────────────────── */
function RegisterContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const fromAdmin = searchParams.get('from') === 'admin';

    const [currentStep, setCurrentStep] = React.useState(0);
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState('');
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => { setMounted(true); }, []);

    const {
        register, handleSubmit, trigger, setValue, watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { persetujuan: false },
    });

    // Auto-compute usia from tanggal lahir
    const watchTanggal = watch('tanggalLahir');
    React.useEffect(() => {
        if (!watchTanggal) return;
        const birth = new Date(watchTanggal);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age >= 0) setValue('usia', String(age), { shouldValidate: true });
    }, [watchTanggal, setValue]);

    const nextStep = async () => {
        const valid = await trigger(getFieldsForStep(currentStep) as unknown as Parameters<typeof trigger>[0]);
        if (valid) { setCurrentStep(p => Math.min(p + 1, steps.length - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    };
    const prevStep = () => { setCurrentStep(p => Math.max(p - 1, 0)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    /* ── Submit → Supabase ──── */
    const onSubmit = async (data: FormData) => {
        setErrorMsg('');
        const catatan = [
            `Ortu: ${data.namaOrangTua}`,
            `Pekerjaan: ${data.pekerjaanOrangTua}`,
            `Email: ${data.email}`,
            `Sekolah: ${data.sekolahAsal} (${data.kelasGrade})`,
            `Jenis kelamin: ${data.jenisKelamin}`,
            `Darurat: ${data.kontakDaruratNama} (${data.kontakDaruratHubungan}) ${data.kontakDaruratNo}`,
            `Jadwal: ${data.hariJamBelajar}`,
            `Sumber: ${data.sumberInformasi}`,
            data.riwayatKesehatan ? `Kesehatan: ${data.riwayatKesehatan}` : null,
            data.alergi ? `Alergi: ${data.alergi}` : null,
            data.hobiMinat ? `Hobi: ${data.hobiMinat}` : null,
            data.ukuranBajuDewasa ? `Baju dewasa: ${data.ukuranBajuDewasa}` : null,
            data.ukuranBajuAnak ? `Baju anak: ${data.ukuranBajuAnak}` : null,
        ].filter(Boolean).join(' · ');

        const { error } = await supabase.from('students').insert([{
            nama: data.namaLengkap,
            panggilan: data.namaPanggilan,
            telepon: data.noWhatsapp,
            usia: data.usia,
            level: data.programLes,
            alamat: data.domisili,
            catatan,
            tanggal_daftar: new Date().toISOString().split('T')[0],
        }]);

        if (error) { setErrorMsg(error.message); return; }
        setIsSubmitted(true);
    };

    if (!mounted) return null;

    /* ── Success screen ───────── */
    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-app)' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full p-12 text-center space-y-6 rounded-2xl border"
                    style={{ background: 'white', borderColor: 'var(--border)' }}
                >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--success-bg)' }}>
                        <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--success)' }} />
                    </div>
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                        {fromAdmin ? 'Murid Berhasil Didaftarkan!' : 'Pendaftaran Berhasil!'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 500 }}>
                        {fromAdmin
                            ? 'Data murid baru telah tersimpan dan langsung muncul di daftar murid.'
                            : 'Terima kasih telah mendaftar di Mingxian. Tim kami akan segera menghubungi Anda melalui WhatsApp.'}
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push(fromAdmin ? '/admin/murid' : '/')}
                            className="btn-primary w-full justify-center py-3"
                        >
                            {fromAdmin ? 'Kembali ke Daftar Murid' : 'Kembali ke Beranda'}
                        </button>
                        {fromAdmin && (
                            <button
                                onClick={() => { window.location.href = '/register?from=admin'; }}
                                className="block w-full text-sm font-bold transition-colors"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                + Daftarkan Murid Lain
                            </button>
                        )}
                        {!fromAdmin && (
                            <Link href="/login" className="block text-sm font-bold transition-colors" style={{ color: 'var(--text-muted)' }}>
                                Masuk sebagai Admin
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    /* ── Main form ─────────────── */
    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'var(--bg-app)' }}>
            <div className="max-w-3xl mx-auto">

                {/* Back nav */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(fromAdmin ? '/admin/murid' : '/')}
                        className="inline-flex items-center gap-2 text-xs font-bold transition-colors group"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        {fromAdmin ? 'Kembali ke Daftar Murid' : 'Kembali ke Beranda'}
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg"
                        style={{ background: 'var(--primary)', boxShadow: '0 8px 24px var(--primary-glow)' }}>
                        M
                    </div>
                    <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.875rem', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Formulir Pendaftaran Murid Baru
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Silakan lengkapi data di bawah ini untuk bergabung dengan Mingxian.</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-between mb-12 relative">
                    <div className="absolute top-5 left-0 w-full h-0.5 -translate-y-1/2 z-0" style={{ background: 'var(--border)' }} />
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        const isActive = i === currentStep;
                        const isCompleted = i < currentStep;
                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4',
                                    isActive ? 'text-white scale-110 shadow-lg' : '',
                                    isCompleted ? 'text-white' : '',
                                    !isActive && !isCompleted ? '' : '',
                                )}
                                    style={{
                                        background: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : '#E7E5E4',
                                        borderColor: 'var(--bg-app)',
                                        color: isActive || isCompleted ? 'white' : '#A8A29E',
                                        boxShadow: isActive ? '0 4px 16px var(--primary-glow)' : 'none',
                                    }}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-bold uppercase mt-2 tracking-wider hidden sm:block"
                                    style={{ color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)' }}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Form card */}
                <form onSubmit={handleSubmit(onSubmit)}
                    className="p-8 md:p-12 rounded-2xl border shadow-xl"
                    style={{ background: 'white', borderColor: 'var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-8"
                        >

                            {/* ── Step 0: Data Anak ── */}
                            {currentStep === 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <User className="w-3 h-3" /> Nama Lengkap *
                                        </label>
                                        <input {...register('namaLengkap')} placeholder="Masukkan nama lengkap anak" className={inp(!!errors.namaLengkap)} />
                                        {errors.namaLengkap && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.namaLengkap.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Nama Panggilan *</label>
                                        <input {...register('namaPanggilan')} placeholder="Nama panggilan" className={inp(!!errors.namaPanggilan)} />
                                        {errors.namaPanggilan && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.namaPanggilan.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Jenis Kelamin *</label>
                                        <select {...register('jenisKelamin')} className={inp(!!errors.jenisKelamin)}>
                                            <option value="">Pilih Jenis Kelamin</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                        {errors.jenisKelamin && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.jenisKelamin.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Calendar className="w-3 h-3" /> Tanggal Lahir *
                                        </label>
                                        <input type="date" {...register('tanggalLahir')} className={inp(!!errors.tanggalLahir)} />
                                        {errors.tanggalLahir && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.tanggalLahir.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Usia (Otomatis)</label>
                                        <input type="number" readOnly {...register('usia')} placeholder="Terisi otomatis" className={cn(inp(!!errors.usia), 'cursor-not-allowed opacity-60')} />
                                        {errors.usia && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.usia.message}</p>}
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <MapPin className="w-3 h-3" /> Domisili / Alamat *
                                        </label>
                                        <textarea {...register('domisili')} placeholder="Alamat lengkap tempat tinggal saat ini" rows={2} className={cn(inp(!!errors.domisili), 'resize-none')} />
                                        {errors.domisili && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.domisili.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <School className="w-3 h-3" /> Sekolah Asal *
                                        </label>
                                        <input {...register('sekolahAsal')} placeholder="Nama sekolah" className={inp(!!errors.sekolahAsal)} />
                                        {errors.sekolahAsal && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.sekolahAsal.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Kelas / Grade *</label>
                                        <input {...register('kelasGrade')} placeholder="Contoh: 2 SD" className={inp(!!errors.kelasGrade)} />
                                        {errors.kelasGrade && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.kelasGrade.message}</p>}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 1: Data Orang Tua ── */}
                            {currentStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Users className="w-3 h-3" /> Nama Orang Tua / Wali *
                                        </label>
                                        <input {...register('namaOrangTua')} placeholder="Nama lengkap ayah/ibu/wali" className={inp(!!errors.namaOrangTua)} />
                                        {errors.namaOrangTua && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.namaOrangTua.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Briefcase className="w-3 h-3" /> Pekerjaan *
                                        </label>
                                        <input {...register('pekerjaanOrangTua')} placeholder="Pekerjaan orang tua" className={inp(!!errors.pekerjaanOrangTua)} />
                                        {errors.pekerjaanOrangTua && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.pekerjaanOrangTua.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Phone className="w-3 h-3" /> No. WhatsApp Aktif *
                                        </label>
                                        <input {...register('noWhatsapp')} placeholder="Contoh: 081234567890" className={inp(!!errors.noWhatsapp)} />
                                        {errors.noWhatsapp && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.noWhatsapp.message}</p>}
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Mail className="w-3 h-3" /> Email *
                                        </label>
                                        <input type="email" {...register('email')} placeholder="email@example.com" className={inp(!!errors.email)} />
                                        {errors.email && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.email.message}</p>}
                                    </div>

                                    {/* Emergency */}
                                    <div className="md:col-span-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                        <h4 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Kontak Darurat (Selain Orang Tua)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Nama Kontak *</label>
                                                <input {...register('kontakDaruratNama')} placeholder="Nama lengkap" className={inp(!!errors.kontakDaruratNama)} />
                                                {errors.kontakDaruratNama && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.kontakDaruratNama.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Hubungan *</label>
                                                <input {...register('kontakDaruratHubungan')} placeholder="Contoh: Kakek / Paman" className={inp(!!errors.kontakDaruratHubungan)} />
                                                {errors.kontakDaruratHubungan && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.kontakDaruratHubungan.message}</p>}
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>No. Telepon Darurat *</label>
                                                <input {...register('kontakDaruratNo')} placeholder="Nomor telepon aktif" className={inp(!!errors.kontakDaruratNo)} />
                                                {errors.kontakDaruratNo && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.kontakDaruratNo.message}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Program & Jadwal ── */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <BookOpen className="w-3 h-3" /> Program Les yang Dipilih *
                                        </label>
                                        <select {...register('programLes')} className={inp(!!errors.programLes)}>
                                            <option value="">Pilih Program</option>
                                            <option value="General">Mandarin General</option>
                                            <option value="Montessori">Montessori Mandarin</option>
                                            <option value="Business">Business Mandarin</option>
                                            <option value="HSK">HSK Preparation</option>
                                            <option value="Private">Private One-on-One</option>
                                            <option value="Trial">Trial Class (Gratis)</option>
                                        </select>
                                        {errors.programLes && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.programLes.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Clock className="w-3 h-3" /> Hari & Jam Belajar *
                                        </label>
                                        <textarea {...register('hariJamBelajar')} placeholder="Contoh: Senin & Rabu, 14:00 – 15:30" rows={3} className={cn(inp(!!errors.hariJamBelajar), 'resize-none')} />
                                        {errors.hariJamBelajar && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.hariJamBelajar.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Dari mana Anda mengetahui Mingxian? *</label>
                                        <select {...register('sumberInformasi')} className={inp(!!errors.sumberInformasi)}>
                                            <option value="">Pilih Sumber</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="TikTok">TikTok</option>
                                            <option value="Teman/Keluarga">Teman / Keluarga</option>
                                            <option value="Brosur/Banner">Brosur / Banner</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                        {errors.sumberInformasi && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{errors.sumberInformasi.message}</p>}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Info Tambahan ── */}
                            {currentStep === 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Riwayat Kesehatan Khusus (jika ada)</label>
                                        <textarea {...register('riwayatKesehatan')} placeholder="Informasi kesehatan penting" rows={2} className={cn(inp(), 'resize-none')} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Alergi (jika ada)</label>
                                        <input {...register('alergi')} placeholder="Daftar alergi anak" className={inp()} />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Hobi / Minat Anak</label>
                                        <textarea {...register('hobiMinat')} placeholder="Apa yang disukai anak?" rows={2} className={cn(inp(), 'resize-none')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Shirt className="w-3 h-3" /> Ukuran Baju Dewasa
                                        </label>
                                        <select {...register('ukuranBajuDewasa')} className={inp()}>
                                            <option value="">Pilih Ukuran</option>
                                            {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                                            <Shirt className="w-3 h-3" /> Ukuran Baju Anak
                                        </label>
                                        <select {...register('ukuranBajuAnak')} className={inp()}>
                                            <option value="">Pilih Ukuran</option>
                                            {['4', '6', '8', '10', '12', '14'].map(s => <option key={s} value={s}>Size {s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 4: Persetujuan ── */}
                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <div className="p-6 rounded-2xl border space-y-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
                                        <h4 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--primary-dark)' }} /> Syarat & Ketentuan
                                        </h4>
                                        <div className="text-xs space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-2" style={{ color: 'var(--text-muted)' }}>
                                            <p>1. Orang tua/wali bertanggung jawab atas kebenaran data yang diberikan.</p>
                                            <p>2. Pembayaran uang les dilakukan paling lambat tanggal 10 setiap bulannya.</p>
                                            <p>3. Ketidakhadiran murid tanpa pemberitahuan minimal 2 jam sebelumnya dianggap sesi terpakai.</p>
                                            <p>4. Mingxian berhak menggunakan dokumentasi kegiatan belajar untuk keperluan promosi internal (kecuali ada keberatan tertulis).</p>
                                            <p>5. Dengan menekan tombol daftar, Anda menyetujui seluruh kebijakan yang berlaku di Mingxian.</p>
                                        </div>
                                    </div>

                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative mt-0.5 shrink-0">
                                            <input type="checkbox" {...register('persetujuan')} className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 rounded-md transition-all"
                                                style={{ borderColor: errors.persetujuan ? 'var(--danger)' : '#D6D3D1' }}
                                                data-peer-checked="bg-primary" />
                                            <style>{`.group input:checked ~ div { background: var(--primary); border-color: var(--primary); }`}</style>
                                            <CheckCircle2 className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text-primary)' }}>
                                            Saya menyetujui seluruh syarat dan ketentuan yang berlaku di Mingxian.
                                        </span>
                                    </label>
                                    {errors.persetujuan && <p className="text-[10px] font-bold" style={{ color: 'var(--danger)' }}>{String(errors.persetujuan.message)}</p>}

                                    {errorMsg && (
                                        <div className="p-4 rounded-xl text-sm font-semibold" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1.5px solid rgba(214,106,106,0.35)' }}>
                                            {errorMsg}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Navigation buttons ── */}
                            <div className="flex items-center justify-between pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                                <button type="button" onClick={prevStep}
                                    className={cn('flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all', currentStep === 0 && 'invisible')}
                                    style={{ color: 'var(--text-muted)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <ChevronLeft className="w-5 h-5" /> Kembali
                                </button>

                                {currentStep === steps.length - 1 ? (
                                    <button type="submit" disabled={isSubmitting}
                                        className="flex items-center gap-2 px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50"
                                        style={{ background: 'var(--primary)', boxShadow: '0 8px 24px var(--primary-glow)' }}>
                                        {isSubmitting
                                            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <><CheckCircle2 className="w-5 h-5" /> Daftar Sekarang</>
                                        }
                                    </button>
                                ) : (
                                    <button type="button" onClick={nextStep}
                                        className="flex items-center gap-2 px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all"
                                        style={{ background: 'var(--primary)', boxShadow: '0 8px 24px var(--primary-glow)' }}>
                                        Lanjut <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </form>

                <p className="text-center mt-8 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Butuh bantuan? Hubungi Admin Mingxian di{' '}
                    <span className="font-bold" style={{ color: 'var(--primary-dark)' }}>0812-3456-7890</span>
                </p>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
                <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
        }>
            <RegisterContent />
        </React.Suspense>
    );
}
