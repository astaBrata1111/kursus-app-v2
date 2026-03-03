"use client";

import Link from "next/link";
import { BookOpen, Star, Users, Clock, ChevronRight, CheckCircle, Phone, MessageSquare } from "lucide-react";

const FEATURES = [
  {
    icon: <Users size={24} />,
    title: "Kelas Kecil & Personal",
    desc: "Maksimal 6 murid per kelas agar setiap anak mendapat perhatian penuh dari pengajar.",
  },
  {
    icon: <Star size={24} />,
    title: "Kurikulum Bersertifikat",
    desc: "Program terstruktur dari dasar percakapan hingga HSK, dirancang oleh ahli bahasa Mandarin.",
  },
  {
    icon: <Clock size={24} />,
    title: "Jadwal Fleksibel",
    desc: "Pilih jadwal weekday atau weekend sesuai aktivitas anak. Kelas pengganti tersedia.",
  },
];

const PROGRAMS = [
  { name: "Mandarin Anak", age: "4–12 tahun", color: "#F59E0B", emoji: "🐼" },
  { name: "Montessori Mandarin", age: "3–6 tahun", color: "#8B5CF6", emoji: "🌸" },
  { name: "Business Mandarin", age: "Remaja & Dewasa", color: "#3B82F6", emoji: "💼" },
  { name: "HSK Preparation", age: "Semua usia", color: "#10B981", emoji: "📚" },
  { name: "Private Class", age: "Semua usia", color: "#EC4899", emoji: "⭐" },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh', fontFamily: 'var(--font-main)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-50" style={{
        background: 'rgba(255,251,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-dark)', lineHeight: 1 }}>Mingxian</p>
              <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kursus Mandarin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2 px-4">Masuk</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Daftar Sekarang <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="badge badge-amber mb-4 inline-flex">✨ Buka penerimaan murid baru 2026</span>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 400,
            lineHeight: 1.2,
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
          }}>
            Belajar Mandarin dengan{" "}
            <span style={{ color: 'var(--primary)' }}>penuh percaya diri</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Pusat kursus Mandarin terpercaya di Surabaya. Kelas kecil, pengajar berpengalaman,
            dan kurikulum yang menyenangkan — dari usia dini hingga dewasa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary text-base py-3 px-8 justify-center">
              Daftar Kelas Trial Gratis
            </Link>
            <a href="https://wa.me/628100000000" target="_blank" rel="noopener noreferrer"
              className="btn-ghost text-base py-3 px-8 justify-center">
              <Phone size={17} /> Hubungi Kami
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {[
              { val: "200+", label: "Murid Aktif" },
              { val: "8 Thn", label: "Pengalaman" },
              { val: "95%", label: "Puas dengan Hasilnya" },
            ].map(t => (
              <div key={t.label} className="text-center">
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-dark)' }}>{t.val}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', fontWeight: 400, color: 'var(--text-primary)' }}>
              Mengapa Mingxian?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Kami merancang setiap detail untuk hasil belajar terbaik</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6" style={{ borderTop: '3px solid var(--primary)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', fontWeight: 400, color: 'var(--text-primary)' }}>
            Program Kami
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Tersedia untuk semua kelompok usia dan tingkat kemampuan</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROGRAMS.map(p => (
            <div key={p.name} className="card p-5 flex items-center gap-4 cursor-pointer group"
              style={{ borderLeft: `3px solid ${p.color}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ background: p.color + '15' }}>
                {p.emoji}
              </div>
              <div>
                <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{p.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.age}</p>
              </div>
              <ChevronRight size={18} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                style={{ color: p.color }} />
            </div>
          ))}
          <div className="card p-5 flex items-center gap-4" style={{ borderLeft: '3px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'white' }}>
              💬
            </div>
            <div>
              <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Konsultasi Gratis</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tanya program terbaik untuk anak</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="card-amber p-10 rounded-2xl text-center">
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.75rem', fontWeight: 400, color: 'white', marginBottom: '0.75rem' }}>
            Anak Anda Bisa Mulai Hari Ini
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Satu kelas trial gratis, tanpa komitmen. Biarkan anak merasakan sendiri.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 justify-center px-8 py-3 rounded-xl font-bold text-base"
              style={{ background: 'white', color: 'var(--primary-dark)' }}>
              <CheckCircle size={18} /> Daftar Trial Gratis
            </Link>
            <a href="https://wa.me/628100000000" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 justify-center px-8 py-3 rounded-xl font-bold text-base"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              <MessageSquare size={18} /> WhatsApp Kami
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'white' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <BookOpen size={13} className="text-white" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>Mingxian Kursus Mandarin</p>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026 Mingxian. Semua hak cipta dilindungi.</p>
          <Link href="/login" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portal Admin</Link>
        </div>
      </footer>
    </div>
  );
}
