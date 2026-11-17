# Project Progress

**Repository:** `https://github.com/Dubirka/pure-canvas-hub-42.git` (`main` branch)  
**Latest Commit:** `5787b02` (`npm run build` verified passing)

---

## What Has Been Implemented

### 1. Authentication & Account Separation (`98eb7dc`, `484148e`)
* **Sign-In Options:** Google OAuth, Email & Password (via Supabase Auth), and **Guest Inspector** offline/demo mode (`guest_inspector`).
* Removed the **Continue with Lovable** login button and unused `LovableMark` import (`98eb7dc`).
* **Per-Account Isolation:** Signed-in accounts (`user.uid`) strictly read/write their own `inspections_${user.uid}` and `properties_${user.uid}` caches locally and query `.eq('user_id', userId)` in Supabase. Guest Inspector stays strictly local to the device.

### 2. Offline-First Storage, Sync Diagnostics & Backup (`6a46e89`, `484148e`)
* **Real-Time Auto-Save:** 500ms debounced saving to `localStorage` with `QuotaExceededError` image-stripping fallback and dashboard draft recovery banner.
* **Cloud Sync Visibility:** Each inspection card displays **`Cloud Synced`** or **`Device Only`**. Dashboard includes a **`Sync Cloud`** diagnostic button that syncs both properties and inspections and surfaces explicit errors if blocked.
* **JSON Backup Modal:** Inspectors can inspect and copy a raw JSON backup of all saved inspections directly from mobile.

### 3. Dashboard Building Folders & Mobile Layout (`455b6dc`, `ba6fd65`, `f59596a`)
* **Mobile Header Layout (`455b6dc`):** Vertically stacked header with title, account email, and wrap-friendly action bar (**Buildings**, **Sync Cloud**, **Backup**, **New**).
* **Building Folders (`ba6fd65`):** Inspections are grouped into collapsible building folders (`propertyId` or normalized `propertyName`) showing address, landlord, unit count, and cloud sync summary.
* **Full Edit & Delete CRUD (`f59596a`):**
  * **Buildings/Properties:** **Buildings** modal on Dashboard plus inline **Edit** and **Delete** buttons next to the **Select Property** dropdown in `ChecklistView` (`PropertyModal` supports both create and edit).
  * **Inspections:** Delete button on each unit card inside building folders and at the bottom of `ChecklistView` (clears device `localStorage`, Supabase, and Firestore with confirmation).

### 4. Collapsible Checklist, Custom Fields & Neighborhoods (`ba6fd65`, `5787b02`)
* **Collapsible Sections (`ba6fd65`):** Sections **`0.` Building & Unit Details**, **`1.`–`7.`** inspection sections, and **`8.` Inspector Summary & TryViet Verdict** collapse/expand individually with live checked/photo counters and **Expand All / Collapse All** controls.
* **Edit Mode:** Rename any label, hide default fields, add custom checkbox/text/number fields, attach compressed photos per section, and add contextual notes.
* **Custom Neighborhoods (`5787b02`):** Added reusable `NeighborhoodSelect` in both `PropertyModal` and `ChecklistView` with expanded Da Nang presets (`Ngu Hanh Son`, `Thanh Khe`, `Lien Chieu`, etc.) plus an inline `+` / `+ Add new neighborhood...` option persisted in `tryviet_custom_neighborhoods`.

### 5. Sanitized Client Share Report (`ba6fd65`)
* Updated `src/components/ClientShareReportModal.tsx` to strip landlord contact info and display **only** verified measurements, checked items, answered custom fields, verdict/honest catch, and attached photos (plus Copy Text Summary and Print/PDF).

---

## Most Recent Work (`5787b02`, `484148e`, `f59596a`)
1. Added custom neighborhood creation (`NeighborhoodSelect`) to both Building creation/editing and Inspection details (`5787b02`).
2. Fixed cross-account local storage leakage on mobile and ensured Supabase cloud sync stamps the signed-in `user_id` on both properties and inspections (`484148e`).
3. Added Edit & Delete capabilities for both saved Buildings/Properties and Unit Inspections (`f59596a`).

