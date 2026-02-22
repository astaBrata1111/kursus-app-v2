import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsApp, normalizePhone } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
    try {
        const { phone, message, delay } = await req.json();
        if (!phone || !message) {
            return NextResponse.json({ success: false, error: 'phone and message required' }, { status: 400 });
        }
        const result = await sendWhatsApp({ target: phone, message, delay });
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
