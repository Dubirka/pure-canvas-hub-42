# TryViet Apartment Quality Checklist — Project Progress Report

**Last Updated:** October 19, 2026  
**Repository:** [Dubirka/pure-canvas-hub-42](https://github.com/Dubirka/pure-canvas-hub-42) (Lovable Cloud) & [borettsbil/tryviet-apartment-checklist](https://github.com/borettsbil/tryviet-apartment-checklist)  
**Status:** Live & Production Ready (PWA Standalone + Cloud Sync)

---

## 1. Executive Summary & Purpose

[TryViet](https://tryviet.com/) provides relocation and housing risk elimination for Western remote workers, digital nomads, couples, and families moving to Da Nang, Vietnam.
- **$599 Soft Landing Tier:** Pre-vetted Day-2 apartment viewing blitz with dedicated local coordination.
- **$1,199 Premium Landing Tier:** Move straight from the airport into a pre-inspected, sight-unseen apartment with 3 months of issue resolution.

The **TryViet Apartment Inspection Checklist** serves as:
1. **The #1 Liability Shield:** Equips local inspectors (e.g., Quyen) with rigorous checks against classic Vietnam apartment traps.
2. **The #1 Sales & Trust Artifact:** Generates a sanitized, branded "Client Share Report" that proves quality without exposing landlord contacts or exact addresses.
3. **An Offline-First Field Tool:** Works inside concrete basements, elevators, and offline units, automatically syncing to the cloud when reconnected.

---

## 2. Where We Are in the Project

| Milestone | Status | Description |
|---|---|---|
| **Core Architecture & UI** | ✅ Completed | React 18, TypeScript, Tailwind CSS, Lucide icons, Vite. |
| **Checklist Flaws & Da Nang Upgrades** | ✅ Completed | All dealbreakers from `checklist_flaws.md` added. |
| **Inspector Verdict & "The Catch"** | ✅ Completed | Section 8 rating, target tags, and honest flaw transparency. |
| **Client Share Report Modal** | ✅ Completed | Broker-safe certificate, copy text summary, print/PDF. |
| **Cloud Sync & Supabase Backend** | ✅ Completed | Lovable Cloud Supabase migration, multi-device RLS, auto-sync. |
| **Progressive Web App (PWA)** | ✅ Completed | Standalone display mode (URL bar hidden), offline Service Worker. |
| **Mobile Touch & Overlay Fixes** | ✅ Completed | Fixed invisible toast overlay, 0ms instant logout, 40px+ touch targets. |

---

## 3. Detailed Feature Breakdown

### Phase 1: Da Nang Dealbreakers & Checklist Upgrades (from `checklist_flaws.md`)

* **Property Header & Media Context:**
  * Neighborhood selector (`An Thuong / My Khe`, `Son Tra / My An`, `Hai Chau`, `Hoi An`).
  * Unit number & floor level (e.g. `Floor 4 of 6`).
  * Google Maps pin URL & Landlord Zalo contact.
  * Walkthrough Video link (essential for $1,199 sight-unseen clients).
* **Section 1: Core Checks:**
  * Dehumidifier availability (`Yes`, `No`, `Needed in rainy season`).
  * Bed size (`Queen 1.6m`, `King 1.8m`) and mattress topper upgrade option.
  * Wi-Fi ping/jitter (`ms`) and ISP selector (`Viettel`, `FPT`, `VNPT`).
  * Mobile 4G/5G indoor reception (`Strong`, `Weak / Deadzone`).
  * Perimeter noise checks (adjacent construction / empty lot within 100m, karaoke/nhậu spots).
  * Typhoon & rainy season window seals (checks for water staining, bubbling paint, silicone peeling).
* **Section 2: Workspace Setup:**
  * Outlet grounding check (`3-prong grounded` vs `2-prong ungrounded - MacBook tingling risk`).
  * Router proximity to desk (`Can plug Ethernet cable directly` vs `Wi-Fi only`).
  * Screen glare check (direct sunlight on monitor without blinds).
* **Section 3: Kitchen & Water:**
  * Stove type (`1-Burner Induction`, `2-Burner Induction`, `Gas`).
  * Fridge capacity (`Full-size with separate freezer` vs `Mini-bar fridge`).
  * Appliance inventory (Kettle, Rice Cooker, Toaster / Air Fryer).
  * Pest entry check (cockroach gap under door, unsealed AC pipe holes, ant trails).
* **Section 4: Bathroom & Laundry:**
  * Hot water tank size (`15L - 5 min shower`, `20L–30L - 10+ min`, `Instant`).
  * Shower separation (`Glass Partition / Dry Toilet`, `Curtain Only`, `Wet Room`).
  * Sewer gas check (floor drain anti-odor P-trap verified, no raw sewage smell).
  * Dryer availability (`Washer + Dryer Combo`, `Separate Dryer`, `Hang-dry only`).
* **Section 5: Comfort & Climate:**
  * AC coverage (`Both Bedroom & Living Room have AC` vs `Bedroom Only`).
  * Window orientation (`East / Morning Sun`, `West / Hot Afternoon Sun`, `North / South`, `Sea Breeze`).
  * Bug screens (`Installed` vs `None - Mosquito risk`).
  * Bedding quality (2 pillows per person + clean duvet included).
* **Section 6: Building & Security:**
  * Street flooding risk (`High ground / Dry` vs `Prone to ankle-deep water in heavy rain`).
  * Backup generator (`Powers Elevator & Wi-Fi` vs `None`).
  * Package drop-off (lobby shelf or guard for GrabFood / Shopee).
* **Section 7: Landlord & Terms:**
  * Foreigner Police Registration (*Khai báo tạm trú* confirmed immediate online registration).
  * Deposit return track record (`Verified Trusted Landlord` vs `New / Unverified`).
  * Accepted payment methods (`Cash VND`, `Local Bank / Wise Transfer`, `Card`).
  * Cleaning frequency + bedsheet change confirmation.

---

### Phase 2: Inspector Summary & TryViet Verdict (Section 8)

* **Overall Score:** `Approved - Premium Tier ($1,199)`, `Approved - Soft Landing Only ($599)`, `Rejected - Do Not Show`.
* **Best For Tags:** Toggle pills for `Light Sleeper`, `Heavy Zoom Caller`, `Couple`, `Cook-at-Home`, `Solo Nomad`, `Rainy Season Stay`, `Beach Lover`.
* **The Catch (#1 Flaw):** A dedicated text field forcing inspectors to document the apartment's single biggest weakness (e.g., *"Living room AC takes 15 min to cool at 2 PM, wet-room shower"*). Eliminates client disputes and establishes 100% credibility.

---

### Phase 3: Client Share Report Modal

* **Broker Margin Protection:** Automatically strips Landlord Name, Phone, Zalo, and exact street address to prevent $599 Soft Landing clients from bypassing TryViet.
* **Branded Certificate Layout:**
  * TryViet Verified Quality Seal with neighborhood and floor.
  * Key metrics summary (Wi-Fi DL/UL/ping, noise dB open vs closed, bed feel, shower layout).
  * "The Honest Catch" highlighted note.
  * Video walkthrough link button.
  * Verified inspector photo gallery.
  * **"Copy Text Summary"** button (formatted for WhatsApp/Telegram).
  * **"Print / Save PDF"** button with clean print stylesheets.

---

### Phase 4: Progressive Web App (PWA) Transformation

* **Standalone Display (No URL Bar):**
  * `public/manifest.webmanifest` configured with `display: "standalone"` and `orientation: "portrait-primary"`.
  * iOS Web App meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`) in `index.html`.
  * `viewport-fit=cover` for edge-to-edge rendering around iPhone notches and Android cutouts.
* **App Icons Suite:** High-resolution icons in `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-maskable.png`, `apple-touch-icon.png`, `icon.svg`, `favicon.svg`).
* **Offline Service Worker (`public/sw.js`):** Intercepts requests, caches the app shell and assets, and serves cached content when offline.
* **Mobile Floating Action Bar:** Sticky bottom bar on mobile screens with quick **"Share Report"** and **"Save Inspection"** buttons.

---

### Phase 5: Mobile Touch Polish & Invisible Overlay Fix

* **The Invisible Overlay Bug Fix:** Resolved an issue where Radix `<ToastViewport />` was rendering an invisible full-screen overlay without `pointer-events-none`, intercepting mobile taps on top buttons. Configured `<ToastViewport className="pointer-events-none [&>*]:pointer-events-auto" />`.
* **Instant 0ms Logout:** Removed network-blocking `await logout()`, making the UI switch instantly to the Login view while signing out Firebase in the background.
* **Large Touch Targets:** Back button and Logout button updated to 40px+ touch targets (`h-10`) with `touch-manipulation` and tactile active states (`active:scale-95`).
* **"Add to Home Screen" Dialog:** Header button opens a clear, visual modal with step-by-step instructions for Safari iOS (`Share` → `Add to Home Screen`) and Android Chrome (`⋮` → `Install app`).

---

## 4. Database & Synchronization Schema

### Supabase Table: `public.inspections`
* Columns: `id` (PK), `user_id`, `property_id`, `property_name`, `property_address`, `neighborhood`, `unit_floor`, `maps_url`, `landlord_name`, `landlord_phone`, `landlord_zalo`, `video_url`, `verdict_score`, `verdict_best_for` (JSONB), `verdict_catch`, `checklist_data` (JSONB), `notes` (JSONB), `images` (JSONB), `hidden_fields` (JSONB), `label_overrides` (JSONB), `custom_fields` (JSONB), `created_at`, `updated_at`.
* Safe migration file: `supabase/migrations/20261018235500_create_inspections_and_properties.sql`.

### Supabase Table: `public.properties`
* Columns: `id` (PK), `name`, `address`, `neighborhood`, `landlord_name`, `landlord_phone`, `landlord_zalo`, `created_at`.

### Multi-Tier Sync Flow:
1. **Local First:** Writes immediately to `localStorage` (`inspections_${userId}`) so work is never lost.
2. **Cloud Sync:** Writes simultaneously to Supabase backend (Lovable Cloud).
3. **Auto-Discovery:** On dashboard launch, the app scans all local storage keys (including guest inspector sessions) and auto-uploads any unsynced checklists to Supabase.

---

## 5. Technology Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Motion.
* **Build Tool:** Vite 5 (Bundles under 11s, zero TypeScript errors).
* **Backend:** Supabase (PostgreSQL + Row-Level Security + Realtime) & Firebase Auth.
* **PWA:** Web App Manifest + Service Worker + Native Web Share & Dialog APIs.
* **Hosting / Git:** Synchronized with Lovable Cloud and GitHub.

---

## 6. Next Steps & Recommended Enhancements

1. **Photo Compression & Direct Cloud Storage:** Integrate Supabase Storage buckets for high-res photo uploads beyond base64 string limits.
2. **Multi-Inspector Collaboration:** Assign inspection audits to specific inspectors (e.g. Quyen) with status flags (`Draft`, `Under Review`, `Approved`).
3. **PDF Generation API:** Optional server-side PDF generator to email certificates directly to clients upon approval.
4. **Offline Sync Queue Badge:** Visual indicator showing "3 checks synced / 1 queued" when transitioning between offline and online.
