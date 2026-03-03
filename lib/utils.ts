import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Normalize Indonesian phone to E.164-style 628xxx format */
export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) return '62' + digits.slice(1);
    if (digits.startsWith('62')) return digits;
    return '62' + digits;
}

/** Format IDR currency. e.g. 1500000 → "Rp 1.500.000" */
export function formatIDR(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

/** Format IDR in millions. e.g. 1500000 → "Rp 1,5jt" */
export function formatIDRMillion(amount: number): string {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
}

/** Compute age from a date of birth string or Date */
export function computeAge(dob: string | Date): number {
    const birth = typeof dob === 'string' ? new Date(dob) : dob;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}
