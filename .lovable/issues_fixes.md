# Issues & Fixes Log

This document records the bugs, root causes, and implemented fixes across the **TryViet Apartment Inspection PWA** (`src/pages/Index.tsx`, `src/services/supabaseStorage.ts`, `src/components/ClientShareReportModal.tsx`).

---

## 1. Git Remote Mismatch (`Pull` Unresponsive in IDE)
* **Symptom:** Clicking Pull in the IDE did not pull recent commits from Lovable.
* **Root Cause:** Local `origin` remote pointed to an older repository (`borettsbil/tryviet-apartment-checklist`) rather than the Lovable-connected GitHub repository (`Dubirka/pure-canvas-hub-42.git`).
* **Fix:** Switched `origin` to `https://github.com/Dubirka/pure-canvas-hub-42.git` and aligned local `main` with `origin/main`.

---

## 2. Saved Inspections Opening as Blank Checklists
* **Symptom:** Tapping a saved inspection card opened an empty checklist with only the property name visible.
* **Root Causes:**
  * Field-naming mismatch (`camelCase` vs `snake_case`, e.g., `checklistData` vs `checklist_data`) and stringified JSON payloads returned from storage.
  * No continuous auto-save during field inspections, plus uncaught `QuotaExceededError` in `localStorage` when storing compressed photos.
* **Fix:**
  * Added `mapRowToInspection`, `mapInspectionToRow`, and `parseJsonSafe` in [supabaseStorage.ts](file:///c:/Users/Huawei/Desktop/My%20Projects/AI%20Projects/tryviet-apartment-checklist/src/services/supabaseStorage.ts) to normalize data shapes bidirectionally.
  * Added 500ms debounced auto-save to `localStorage` (`inspections_${user.uid}` and `tryviet_active_draft_${user.uid}`) with `QuotaExceededError` fallback (strips heavy base64 images if quota is hit so checklist answers are preserved) and a dashboard **Unsaved Inspection Draft Recovered** banner.

---

## 3. Silent Cloud Sync Failures & Missing Supabase Diagnostics (`6a46e89`)
* **Symptom:** Users assumed inspections were stored in Supabase because they appeared on the phone, while Supabase tables remained empty.
* **Root Causes:**
  * Supabase Row Level Security (`0000_restrict_inspection_and_property_access.sql`, `0001_scope_properties_to_owner.sql`, `19032a6`) rejected unauthenticated/`anon` or mismatched-UID writes.
  * `saveInspectionToSupabase` and `savePropertyToSupabase` caught errors with `console.warn` and returned `false` without surfacing errors in the UI.
* **Fix:**
  * Added `testSupabaseAccess()` and updated `saveInspectionToSupabase` / `savePropertyToSupabase` in [supabaseStorage.ts](file:///c:/Users/Huawei/Desktop/My%20Projects/AI%20Projects/tryviet-apartment-checklist/src/services/supabaseStorage.ts) to return `{ success, error }`.
  * Added **`Cloud Synced`** / **`Device Only`** status pills on inspection cards and a **`Sync Cloud`** diagnostic button in `DashboardView` that surfaces exact Supabase error messages.

---

## 4. Cross-Account Data Leakage on Phone & Missing Desktop Sync (`484148e`)
* **Symptom:** Logging into a new account on the phone still showed buildings and inspections saved under a previous account. Saving an existing building under the new account on the phone still did not make it appear when logging into that same account on Desktop.
* **Root Causes:**
  1. `getAllLocalInspections()` scanned *every* `inspections_*` key in `localStorage` across all users on the phone, merging previous accounts' data into newly signed-in users.
  2. `fetchInspectionsFromSupabase()` queried `or(user_id.eq.${userId},user_id.eq.guest_inspector)`, mixing guest rows into signed-in accounts.
  3. Leaked inspections carried the *previous* user's `userId`, so Supabase RLS (`auth.uid()::text = user_id`) blocked updates from the new user.
  4. `savePropertyToSupabase()` omitted `user_id` and was not synced alongside inspections; `PropertyModal` and `ChecklistView.handleSave()` caught errors silently.
  5. `ChecklistView.handleSave()` generated a fresh `crypto.randomUUID()` instead of `currentDraftId` and left stale drafts behind.
* **Fix:**
  * Isolated `getAllLocalInspections(userUid)` and `removeLocalInspection(id, userUid)` strictly to `userUid` (`inspections_${userUid}`, plus legacy un-scoped keys only for `guest_inspector`).
  * Added per-user property caching (`getLocalProperties`, `saveLocalProperties` under `properties_${userUid}`).
  * Updated `fetchInspectionsFromSupabase(userId)` and `fetchPropertiesFromSupabase(userId)` to query strictly `.eq('user_id', userId)` and return `[]` for `guest_inspector`.
  * Updated `savePropertyToSupabase(property, userId)` to always stamp `user_id`.
  * Updated `ChecklistView.handleSave()` to reuse `currentDraftId`, clear `tryviet_active_draft_${user.uid}`, sync any linked property before saving the inspection, and alert the user explicitly if cloud sync fails while signed in.

---

## 5. Mobile Dashboard Header Cramping (`455b6dc`)
* **Symptom:** Dashboard title, signed-in email, and action buttons squeezed onto one line and overlapped on narrow mobile screens.
* **Fix:** Stacked the `DashboardView` header vertically (`flex-col gap-3`) so **Your Inspections** is on line 1, **Signed in as ...** sits directly below it (`break-all`), and action buttons wrap cleanly underneath.

---

## 6. "Share Client Report" Displaying Unchecked / Fabricated Specs (`ba6fd65`)
* **Symptom:** Previewing or copying the client report showed details that the inspector never checked or entered (e.g., `Queen (1.6m)`, `Induction`, `Floor Router`, `Standard Drain`, or `Noisy` for blank decibels).
* **Root Cause:** [ClientShareReportModal.tsx](file:///c:/Users/Huawei/Desktop/My%20Projects/AI%20Projects/tryviet-apartment-checklist/src/components/ClientShareReportModal.tsx) used hardcoded fallback strings for empty keys and compared `'--' <= 55`, causing blank sound fields to fall through to `'Noisy'`.
* **Fix:** Removed all fabricated defaults; metric cards, section breakdown cards, and the copied text summary now render **only** checks and values actually recorded (plus an empty-state message when nothing has been checked yet).

---

## 7. Overwhelming Checklist Scroll on Mobile (`ba6fd65`)
* **Symptom:** Starting an inspection rendered all 8 sections permanently expanded in one long page.
* **Fix:** Turned **`0. Building & Unit Details`**, sections **`1.`–`7.`**, and **`8. Inspector Summary & TryViet Verdict`** into collapsible accordions with **Expand All / Collapse All** controls and live **`X checked`** and photo count badges in section headers.
