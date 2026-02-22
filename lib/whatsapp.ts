/**
 * Fonnte WhatsApp API Wrapper
 * Docs: https://docs.fonnte.com
 * Register at: https://fonnte.com
 */

const FONNTE_API_URL = 'https://api.fonnte.com/send';
const FONNTE_TOKEN = process.env.FONNTE_API_TOKEN || '';

interface SendWAOptions {
    target: string;   // Phone number: "08123456789" or "62812345678"
    message: string;
    delay?: number;   // Optional delay in seconds
}

interface WAResult {
    success: boolean;
    error?: string;
}

/** Normalize Indonesian phone to 62xxxx format */
export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    if (digits.startsWith('62')) return digits;
    return '62' + digits;
}

/** Send a single WhatsApp message via Fonnte */
export async function sendWhatsApp({ target, message, delay = 0 }: SendWAOptions): Promise<WAResult> {
    if (!FONNTE_TOKEN) {
        console.warn('[WhatsApp] FONNTE_API_TOKEN not set — message not sent.');
        return { success: false, error: 'Token not configured' };
    }

    const phone = normalizePhone(target);
    try {
        const res = await fetch(FONNTE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': FONNTE_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ target: phone, message, delay }),
        });

        const textResponse = await res.text();
        console.log('[WhatsApp] Response from Fonnte:', textResponse);

        let json;
        try {
            json = JSON.parse(textResponse);
        } catch (e) {
            console.error('[WhatsApp] Failed to parse JSON from Fonnte', e);
            return { success: false, error: 'Invalid response from Fonnte' };
        }

        if (json.status === false) {
            console.error('[WhatsApp] Send failed:', json.reason);
            return { success: false, error: json.reason };
        }
        return { success: true };
    } catch (err: any) {
        console.error('[WhatsApp] Catch Error:', err.message);
        return { success: false, error: err.message };
    }
}

/** Pre-built message templates */
export const waTemplates = {
    sessionReminder24h: (kelasNama: string, jam: string, ruang: string) =>
        `⏰ *Pengingat Kelas Besok*\n\nKelas *${kelasNama}* akan dimulai besok pukul *${jam}* di ruangan *${ruang}*.\n\nJangan lupa hadir ya! 😊\n\n_– Tim Mingxian_`,

    sessionReminder1h: (kelasNama: string, jam: string) =>
        `🔔 *Kelas Dimulai 1 Jam Lagi!*\n\nKelas *${kelasNama}* akan dimulai pukul *${jam}*.\n\nSiapkan diri dan hadir tepat waktu! 🚀`,

    invoiceCreated: (siswa: string, bulan: string, nominal: number, dueDate: string) =>
        `📄 *Tagihan Kursus*\n\nTagihan bulan *${bulan}* untuk *${siswa}* sebesar:\n\n💰 *Rp ${nominal.toLocaleString('id-ID')}*\n\nJatuh tempo: *${dueDate}*\n\nSilakan lakukan pembayaran tepat waktu. Terima kasih! 🙏\n\n_– Tim Mingxian_`,

    invoiceOverdue: (siswa: string, bulan: string, nominal: number) =>
        `⚠️ *Pengingat Keterlambatan Pembayaran*\n\nTagihan bulan *${bulan}* untuk *${siswa}* sebesar *Rp ${nominal.toLocaleString('id-ID')}* belum dibayar.\n\nMohon segera lakukan pembayaran. Jika ada kendala, hubungi kami.\n\n_– Tim Mingxian_`,

    invoicePaid: (siswa: string, bulan: string) =>
        `✅ *Pembayaran Diterima!*\n\nPembayaran bulan *${bulan}* untuk *${siswa}* telah kami terima.\n\nTerima kasih atas kepercayaan Anda! 🙏\n\n_– Tim Mingxian_`,

    newScheduleTeacher: (kelasNama: string, hari: string, jam: string, tanggal: string) =>
        `📅 *Jadwal Mengajar Baru*\n\nAnda dijadwalkan mengajar:\n\n🏫 Kelas: *${kelasNama}*\n📆 Hari: *${hari}*, ${tanggal}\n🕐 Jam: *${jam}*\n\nSampai jumpa di kelas! 👩‍🏫`,

    attendanceAlpha: (siswa: string, kelasNama: string, tanggal: string) =>
        `❗ *Informasi Ketidakhadiran*\n\n*${siswa}* tidak hadir (Alpha) pada kelas *${kelasNama}* tanggal ${tanggal} tanpa keterangan.\n\nMohon konfirmasi apakah ada kendala.\n\n_– Tim Mingxian_`,
};
