/**
 * Invoice Auto-Generator Logic
 * Runs on first Friday of each month via Supabase Edge Function cron
 */

import { supabase } from './supabase';
import { sendWhatsApp, waTemplates } from './whatsapp';

/** Check if a given Date is the FIRST Friday of its month */
export function isFirstFriday(date: Date): boolean {
    if (date.getDay() !== 5) return false; // 5 = Friday
    return date.getDate() <= 7;            // First Friday is always in days 1–7
}

/** Get last day of a given month */
export function getLastDayOfMonth(year: number, month: number): string {
    const d = new Date(year, month + 1, 0); // day 0 of next month = last day of this month
    return d.toISOString().split('T')[0];
}

/** Format month name in Indonesian */
export function formatBulanId(year: number, month: number): string {
    return new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export interface AutoInvoiceResult {
    created: number;
    skipped: number;
    errors: string[];
}

/**
 * Main function: auto-generate invoices for all active enrollments.
 * Called from the Edge Function on first Friday of month.
 */
export async function runAutoInvoice(targetDate: Date = new Date()): Promise<AutoInvoiceResult> {
    const result: AutoInvoiceResult = { created: 0, skipped: 0, errors: [] };
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth(); // 0-indexed
    const bulan = formatBulanId(year, month);
    const dueDate = getLastDayOfMonth(year, month);

    // 1. Fetch all active enrollments with student + paket info
    const { data: enrollments, error: enrErr } = await supabase
        .from('enrollments')
        .select(`
      id,
      student_id,
      paket_id,
      students ( id, nama, telepon ),
      paket_kursus ( id, harga, nama )
    `)
        .eq('is_active', true);

    if (enrErr) {
        result.errors.push('Failed to fetch enrollments: ' + enrErr.message);
        return result;
    }

    for (const enr of (enrollments || [])) {
        const student = (enr as any).students;
        const paket = (enr as any).paket_kursus;

        if (!student || !paket) {
            result.skipped++;
            continue;
        }

        // 2. Check if invoice already exists for this student/month
        const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('student_id', enr.student_id)
            .eq('bulan', bulan)
            .single();

        if (existing) {
            result.skipped++;
            continue;
        }

        // 3. Create the invoice
        const { error: insErr } = await supabase.from('invoices').insert({
            student_id: enr.student_id,
            bulan,
            bulan_num: month + 1,
            tahun: year,
            nominal: paket.harga,
            status: 'Belum Bayar',
            level_tagihan: paket.nama,
            paket_id: enr.paket_id,
            due_date: dueDate,
            is_auto_generated: true,
        });

        if (insErr) {
            result.errors.push(`Invoice error for ${student.nama}: ${insErr.message}`);
            continue;
        }

        result.created++;

        // 4. Send WhatsApp to student/parent
        if (student.telepon) {
            const msg = waTemplates.invoiceCreated(student.nama, bulan, paket.harga, dueDate);
            await sendWhatsApp({ target: student.telepon, message: msg });
        }

        // 5. Create in-app notification for admin
        await supabase.from('app_notifications').insert({
            judul: `Invoice Otomatis Dibuat`,
            isi: `Invoice bulan ${bulan} untuk ${student.nama} (Rp ${paket.harga.toLocaleString('id-ID')}) telah dibuat.`,
            link: '/admin/pembayaran',
            is_admin_wide: true,
        });
    }

    return result;
}
