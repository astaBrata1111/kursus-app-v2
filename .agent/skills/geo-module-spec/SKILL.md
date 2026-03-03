---
name: geo-module-spec
description: Business logic rules, role permissions, and module specifications for the Mingxian GEO education management system. Use this skill when implementing any GEO module to ensure role access, data isolation, automation idempotency, and emotional design language are correctly applied.
---

# Mingxian GEO — Module Specification Reference

## Role Permission Matrix

| Module | Owner | Admin | Teacher | Parent | Student |
|---|---|---|---|---|---|
| Dashboard (full) | ✅ | — | — | — | — |
| Dashboard (operational) | ✅ | ✅ | — | — | — |
| Students (full CRUD) | ✅ | ✅ | — | — | — |
| Student Registration | ✅ | ✅ | — | — | — |
| Trials | ✅ | ✅ | — | — | — |
| Schedule (full) | ✅ | ✅ | View own | — | View own class |
| Attendance (mark) | ✅ | ✅ | ✅ | — | — |
| Renewals | ✅ | ✅ | — | Own date | — |
| Revenue Forecast | ✅ | — | — | — | — |
| Reports | ✅ | — | — | — | — |
| Settings | ✅ | — | — | — | — |
| Teaching Journal | ✅ | Read only | Write | — | — |
| Progress Report | ✅ | ✅ | Write | View own child | View own |
| Parent Dashboard | — | — | — | Own child | — |
| Student Portal | — | — | — | — | Own profile |

---

## Student Status Machine

```
trial → active (admin confirms)
active → at_risk (2+ absences in 14 days, automated)
at_risk → active (admin manual or attendance recovers)
any → dropped (admin manual only)
```

Status changes must be logged whenever they occur.

---

## Business Logic Rules (Non-Negotiable)

### Duplicate Parent Detection

Before creating a new parent User on registration, query:

```sql
SELECT id FROM user_profiles
WHERE email = $parentEmail OR whatsapp_number = $parentWhatsapp
LIMIT 1;
```

If found → link new student to existing parent. Never create a duplicate parent account. This supports families with multiple enrolled children.

### Journal Concern Visibility (HARD RULE)

- Entries with `entry_type = 'concern'` must NEVER appear in parent or student portal responses.
- This applies regardless of `is_published` value.
- Implement as a Supabase RLS policy AND a mandatory `.neq('entry_type', 'concern')` query filter.
- Never rely on application-layer filtering alone — it can be forgotten.

### Attendance Percentage

- Computed on read: `(present_count / total_sessions) * 100`
- Never store attendance percentage — calculate it from `attendance` records
- Includes entire enrollment history, not a fixed time window

### Revenue Forecast

- `SUM(monthly_fee) WHERE status = 'active'` — current month
- `SUM(monthly_fee) WHERE renewal_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' AND status != 'dropped'` — next month projection

### Soft Deletes

- Never hard-delete: `students`, `trial_leads`, `journal_entries`
- Use `archived_at = NOW()` for soft delete
- All list queries must include `.is('archived_at', null)` filter
- Hard delete is only acceptable for `whatsapp_logs` cleanup

---

## Automation Idempotency Rules

Every automation job must check "already done" before executing. Use sentinel timestamp fields:

| Job | Idempotency Field |
|---|---|
| 14-day renewal reminder | `students.reminder_sent_at_14day` |
| 3-day renewal reminder | `students.reminder_sent_at_3day` |
| Trial follow-up | `trial_leads.follow_up_status` |
| Class generation | `UNIQUE(template_id, class_date)` DB constraint |

Always mark the sentinel field BEFORE sending the WhatsApp message. Use a transaction if possible.

---

## Automation Queue Specs

### renewal-reminders (Daily 09:00 WIB)

1. Students where `renewal_date = today + 14d AND reminder_sent_at_14day IS NULL` → send `renewal_14day` WA → mark field
2. Students where `renewal_date = today + 3d AND reminder_sent_at_3day IS NULL` → send `renewal_3day` WA → mark field
3. Students where `renewal_date < today AND status != 'at_risk'` → update `status = 'at_risk'`

### trial-followup (Daily 10:00 WIB)

1. Leads where `trial_status = 'attended' AND conversion_status = 'pending' AND trial_date = today - 2d` → send `trial_followup_h48` WA → log
2. Leads where `trial_status = 'no_show'` → send reschedule WA

### absence-risk (Event-triggered after attendance bulk mark)

1. For each absent student, count absences in last 14 days
2. If count >= 2 AND current status != 'at_risk' → update status → log change → send `absence_followup` WA to parent
3. Must be idempotent — running twice must not send second WA or create a duplicate status change log

### class-generator (Daily midnight)

1. For each active `ClassTemplate`, check for existing instances in next 30 days
2. Generate only missing ones — UNIQUE(template_id, class_date) prevents duplicates
3. Safe to run multiple times

---

## WhatsApp Template Reference

| Template Name | Trigger | Variables |
|---|---|---|
| `trial_reminder_h1` | Day before trial | `student_name, trial_date, trial_time` |
| `trial_followup_h48` | 48h after attended trial | `student_name, center_name` |
| `renewal_14day` | 14 days before renewal | `student_name, renewal_date` |
| `renewal_3day` | 3 days before renewal | `student_name, renewal_date` |
| `absence_followup` | On at_risk trigger | `student_name, parent_name` |

---

## GEO Design Principles (Emotional Design Contract)

The system must feel **calm and reassuring** at every layer.

### Colors (Design Tokens)

```
--color-primary:  #4A6FA5   // Calm Slate Blue
--color-healthy:  #6FA67A   // Muted Green (positive)
--color-warning:  #E5B65C   // Soft Amber (watch)
--color-risk:     #D66A6A   // Calm Red (risk — supportive, not alarming)
--color-bg:       #F7F9FB   // Page background
--color-surface:  #FFFFFF   // Card surface
--color-text:     #1E2A3A   // Primary text
--color-text-mid: #4A5C72   // Body text
--color-muted:    #7A8FA6   // Secondary text
```

### Typography

- H1: 32px / weight-600 (DM Sans)
- H2: 24px / weight-600
- Body: 15–16px / weight-400
- Font: DM Sans (body), DM Serif Display (accent headings)

### Animation Rules

- Hover: 150ms ease-out
- Modal open/close: 200ms ease-out
- Status color fade: 250ms ease-in-out
- AttendanceToggle spring: 200ms
- Page transition: Framer Motion AnimatePresence
- **NEVER use**: flashing alerts, pulsing risk indicators, shake animations

### GEO Voice Copy (Empty States & Errors)

Use supportive language, not generic alerts:

- ❌ `"Error: No data found"`
- ✅ `"Belum ada murid yang perlu perhatian — semuanya lancar!"`
- ❌ `"Error 500"`
- ✅ `"Terjadi kendala kecil. Mari coba lagi sebentar."`

---

## Owner Dashboard — 6 Widgets

All must load in a single parallel `Promise.all()` call, completing < 2 seconds total.

1. **Active Students** — count of `status = 'active'` (green)
2. **At-Risk Students** — count of `status = 'at_risk'` (amber, click → filtered students list)
3. **Renewals in 30 Days** — count of students renewing within 30 days (amber if > 5)
4. **Trial Conversion Rate** — current month `(converted / total_leads) * 100` (green if > 60%)
5. **Attendance Rate (30d)** — overall platform attendance last 30 days (green if > 80%)
6. **Revenue Forecast** — next month projected from active + renewing students (no color gate)

---

## Student Registration Form — 6 Sections

Structure the form in these labeled sections:

1. **Identitas Murid** — full_name, nickname, gender, date_of_birth (age auto-computes), domicile
2. **Info Sekolah** — school_name, grade
3. **Data Orang Tua** — parent_name, parent_occupation, parent_whatsapp, parent_email
4. **Program & Jadwal** — program_selected (enum), schedule_preference, first_class_date
5. **Informasi Kesehatan** — health_notes, allergies
6. **Lain-lain** — hobbies, adult_size_consent, shirt_size

On submit:

1. Check duplicate parent (by email + WhatsApp)
2. Create or link parent `user_profiles` record
3. Create `students` record with `status = 'trial'`
4. Create `enrollments` record
5. Send welcome WA via Fonnte
6. Log WA to `whatsapp_logs`

Age must be computed from `date_of_birth` on form submission — never ask admin to type it.
