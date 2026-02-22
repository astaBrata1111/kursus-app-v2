import { NextRequest, NextResponse } from 'next/server';
import { runAutoInvoice } from '@/lib/invoice-generator';

/**
 * POST /api/auto-invoice
 * Triggers auto invoice generation.
 * In production, this should be called by a Supabase Edge Function cron on first Friday.
 * Protected by a simple secret header.
 */
export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('x-cron-secret');
    if (authHeader !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runAutoInvoice();
    return NextResponse.json(result);
}

// Allow GET for manual triggering from admin (dev only)
export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Dev only' }, { status: 403 });
    }
    const result = await runAutoInvoice();
    return NextResponse.json(result);
}
