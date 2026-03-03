---
name: supabase-nextjs-patterns
description: Patterns and conventions for Supabase + Next.js App Router in the Mingxian GEO project. Use this skill when writing queries, auth flows, RLS policies, Edge Functions, or Supabase Storage interactions for kursus-app-v2.
---

# Supabase + Next.js Patterns — Mingxian GEO

## Project Stack

- **Next.js 15+ App Router** with TypeScript strict mode
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions + RLS)
- **Fonnte** for WhatsApp sends (`lib/whatsapp.ts`)
- **TailwindCSS 4** for styling
- **Client Supabase**: `lib/supabase.ts` → `createBrowserClient`
- **Server Supabase**: `lib/supabase-server.ts` → `createServerClient` (for Server Components / API Routes)

---

## 1. Supabase Client Usage

### Client Components (use client)

```typescript
import { supabase } from '@/lib/supabase';
const { data, error } = await supabase.from('students').select('*');
```

### Server Components / Route Handlers

```typescript
import { createClient } from '@/lib/supabase-server';
const supabase = await createClient();
const { data } = await supabase.from('students').select('*');
```

---

## 2. Authentication Patterns

### Get current user in client component

```typescript
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id;
```

### Get role from user_profiles

```typescript
const { data: profile } = await supabase
  .from('user_profiles')
  .select('role, is_active')
  .eq('id', userId)
  .single();
// role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent'
```

### Role enum values used in this project

```typescript
type Role = 'owner' | 'admin' | 'teacher' | 'student' | 'parent' | null;
```

---

## 3. Row Level Security (RLS)

### CRITICAL: Parent Portal Isolation

Every query touching `students` in parent-facing pages MUST include this filter.
Never trust a student ID from the URL — always verify against `auth.uid()`.

**As a Supabase RLS policy (preferred):**

```sql
CREATE POLICY parent_view_own_student ON students
  FOR SELECT TO authenticated
  USING (parent_user_id = auth.uid());
```

**As a query filter (fallback):**

```typescript
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('parent_user_id', userId); // userId from session — NEVER from URL params
```

### CRITICAL: Student Portal Isolation

```sql
CREATE POLICY student_view_own ON students
  FOR SELECT TO authenticated
  USING (student_user_id = auth.uid());
```

### CRITICAL: Journal Concern Entries

`concern` type journal entries must NEVER appear in parent or student portal responses.
Implement as a Supabase Row Level Security policy AND as a mandatory query filter:

```typescript
// Always append this to any journal query exposed to parent/student
.neq('entry_type', 'concern')
.eq('is_published', true)
```

---

## 4. Supabase Storage Patterns

### Upload a file (journal attachment)

```typescript
const { data, error } = await supabase.storage
  .from('journal-attachments')
  .upload(`${entryId}/${fileName}`, fileBuffer, {
    contentType: fileType,
    upsert: false,
  });
// Store data.path in journal_attachments.file_url — NOT the full URL
```

### Get a pre-signed URL (1 hour expiry for reads)

```typescript
const { data: urlData } = await supabase.storage
  .from('journal-attachments')
  .createSignedUrl(filePath, 3600); // 3600 = 1 hour
// Return urlData.signedUrl to client — NEVER store this in DB
```

### Pre-signed upload URL (15 min for uploads)

```typescript
const { data } = await supabase.storage
  .from('journal-attachments')
  .createSignedUploadUrl(`${entryId}/${fileName}`);
// Return data.signedUrl to frontend for direct upload
```

---

## 5. Supabase Edge Functions

### Create a new Edge Function

```
supabase functions new function-name
```

### Edge Function structure

```typescript
// supabase/functions/function-name/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service role for Edge Functions
  );
  // ... logic here
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Idempotency pattern (CRITICAL for automation jobs)

```typescript
// Always check before triggering action
const { data: student } = await supabase
  .from('students')
  .select('reminder_sent_at_14day')
  .eq('id', studentId)
  .single();

if (student?.reminder_sent_at_14day) {
  return; // Already sent — skip
}

// Mark BEFORE sending (in same transaction ideally)
await supabase.from('students').update({ reminder_sent_at_14day: new Date().toISOString() }).eq('id', studentId);

// Then send WA
await sendWhatsApp({ ... });
```

### Schedule Edge Function with pg_cron

```sql
-- In Supabase SQL editor
SELECT cron.schedule(
  'renewal-reminders-daily',
  '0 2 * * *', -- 09:00 WIB = 02:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/renewal-reminders',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## 6. WhatsApp (Fonnte) Integration

### Send a WhatsApp message

```typescript
import { sendWhatsApp, normalizePhone } from '@/lib/whatsapp';

const result = await sendWhatsApp({
  target: normalizePhone(phoneNumber), // Handles 08xx → 628xx
  message: `Your message here`,
  delay: 0
});

// ALWAYS log the result to whatsapp_logs
await supabase.from('whatsapp_logs').insert({
  student_id: studentId || null,
  trial_lead_id: trialLeadId || null,
  template_type: 'renewal_14day',
  recipient_number: normalizePhone(phoneNumber),
  status: result.success ? 'sent' : 'failed',
  error_message: result.error || null,
  sent_at: result.success ? new Date().toISOString() : null,
});
```

### Retry pattern with exponential backoff

```typescript
async function sendWithRetry(options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendWhatsApp(options);
    if (result.success) return result;
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}
```

---

## 7. Student Status Machine

Valid transitions:

```
trial     → active   (admin confirms enrollment)
active    → at_risk  (automated: 2+ absences in 14 days)
at_risk   → active   (admin manual override or attendance recovers)
any       → dropped  (admin manual only)
```

Status affects UI:

- `active` → green StatusBadge
- `trial` → blue StatusBadge  
- `at_risk` → amber StatusBadge  
- `dropped` → muted gray StatusBadge

---

## 8. Naming Conventions

- **DB tables**: `snake_case`, always plural (`trial_leads`, `journal_entries`, `whatsapp_logs`)
- **React components**: `PascalCase` (`StudentCard.tsx`, `StatusBadge.tsx`)
- **Hooks**: `camelCase` with `use` prefix (`useRenewalList.ts`)
- **API route paths**: kebab-case (`/api/trial-leads`, `/api/send-whatsapp`)
- **Environment variables**: `SCREAMING_SNAKE_CASE` (`FONNTE_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`)
- **TypeScript types/interfaces**: `PascalCase` (`StudentStatus`, `TrialLead`)

---

## 9. Soft Delete Pattern

Students, trial_leads, and journal_entries use soft deletes:

```typescript
// Delete (soft)
await supabase.from('students').update({ archived_at: new Date().toISOString() }).eq('id', id);

// All list queries must exclude archived
await supabase.from('students').select('*').is('archived_at', null);
```

Never hard-delete students, trial leads, or journal entries.

---

## 10. Dashboard Query Optimization

All 6 Owner Dashboard metrics must complete in < 2 seconds total. Use `Promise.all()`:

```typescript
const [activeResult, atRiskResult, renewalsResult, ...] = await Promise.all([
  supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active').is('archived_at', null),
  supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'at_risk').is('archived_at', null),
  // ... other queries
]);
```

Required indexes (add via migration):

```sql
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_renewal_date ON students(renewal_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_student_id ON journal_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_trial_leads_conversion_status ON trial_leads(conversion_status);
```
