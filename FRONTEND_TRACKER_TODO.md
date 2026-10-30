# Project Mingler: Frontend Engineering Progress Tracker & Task Register

**Project:** Mingler (`mingler.co.uk`) — Full-Stack Rebuild (Frontend Application)  
**Framework Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, TanStack React Query v5, Radix UI, Framer Motion, Web Audio API  
**Status:** Part F5 Complete (100/100 Vitest, 115/115 Pytest) — Ready for Part F6 (Phase 1: Inception)  
**Last Updated:** October 2026  

---

## 📊 High-Level Frontend Milestone Overview

| Part | Milestone / Module | Target Architecture & Core Scope | Implementation State | Verification & Testing State |
|---|---|---|---|---|
| **Part F1** | **Design System Foundation & Global Navigation** | "Digital Atelier" palette (`brand-navy`, `brand-coral`, `brand-ivory`), Archivo & Inter typography, responsive Navbar, Footer, and Radix UI primitives. | ✅ **Complete** | ✅ 21/21 Passing (100%) |
| **Part F2** | **Authentication Layer, API Client & UK GDPR Profiles** | Axios client with SimpleJWT auto-refresh, Login, Register, 6-Digit Email OTP verification modal, 3-step Password Reset, Private Profile editor, and zero-PII sanitization. | ✅ **Complete** | ✅ 36/36 Passing (100%) |
| **Part F3** | **Public Experience Discovery & Venues Directory** | Homepage (Hero, category pills, curated carousel), Browse Experiences with multi-facet filters, Mingle Details with dynamic attendee roster (Defect #5 fix) and past date lockout guard (Defect #3 fix), Venues Directory with 7-day operating schedule. | ✅ **Complete** | ✅ 68/68 Vitest, 113/113 Pytest |
| **Part F4** | **Booking Engine, Stripe Checkout & Base44 Member Dashboard** | Places selector (1-5), Stripe Checkout session initiation, Booking confirmation with dynamic `.ics` calendar invitation download, member booking dashboard with instant capacity release, Base44 ProfileSummaryCard, VerifiedBadge, PersonProfile (`/people/[id]`), and dynamic card attendee previews. | ✅ **Complete** | ✅ 87/87 Vitest, 115/115 Pytest |
| **Part F5** | **Post-Mingle Experience & Double-Blind Mutual Matching** | Attendance-gated experience feedback (Defect #4 fix), 3NF venue reviews (Defect #7 fix), double-blind attendee selection grid ($A \leftrightarrow B$), Web Audio API `AudioContext` celebration chime, two-stage confetti burst, and connections dashboard. | ✅ **Complete** | ✅ 100/100 Vitest, 115/115 Pytest |
| **Part F6** | **Venue Partner Portal & Founder Admin Dashboard** | Self-service venue registration with email verification check, 7-day operating hours time-pickers (Defect #8 fix), mingle proposal submissions, founder curation & approval queues (approve, reject, changes requested with curator notes), and platform fee manager with audit trail. | 🔄 **Ready to Start (Phase 1)** | ⏳ Queued next |

---

## 📝 Detailed Task Register & Component Breakdown

### 🎨 Part F1: Design System Foundation, Global Navigation & UI Primitives
- [x] Initialize `frontend/` directory with Next.js 15 App Router, TypeScript, and Tailwind CSS.
- [x] Configure `globals.css` with exact Mingler "Digital Atelier" design tokens:
  - `brand-navy`: `hsl(217 48% 12%)`
  - `brand-ivory`: `hsl(42 39% 94%)`
  - `brand-coral`: `hsl(358 100% 68%)`
  - `brand-blue`: `hsl(216 33% 49%)`
  - `brand-stone`: `hsl(40 14% 83%)`
  - `brand-ink`: `hsl(220 12% 10%)`
- [x] Configure Google fonts (`Archivo` for headings & `Inter` for body) with optimization and zero layout shift.
- [x] Build reusable UI component primitives (`components/ui/`):
  - [x] `button.tsx` (primary, secondary, coral, outline, ghost variants with loading spinner)
  - [x] `badge.tsx` (tags, status indicators, sold-out alerts)
  - [x] `avatar.tsx` (aspect-square object-cover with fallback initials — **Defect #1 fix**)
  - [x] `input.tsx` (styled form inputs with accessible error messaging)
  - [x] `dialog.tsx` (Radix UI accessible modal with backdrop blur)
  - [x] `sheet.tsx` (Radix UI mobile slide-over drawer)
  - [x] `tabs.tsx` (Radix UI accessible tab triggers and content)
- [x] Build global layout and navigation (`components/layout/`):
  - [x] `providers.tsx` (TanStack QueryClientProvider & Sonner Toaster)
  - [x] `navbar.tsx` (desktop header with sticky blur, brand logo, browse links, and mobile hamburger Sheet)
  - [x] `footer.tsx` (London borough links, newsletter signup, legal/terms, and UK GDPR note)
  - [x] `layout.tsx` (`app/layout.tsx` wrapping Providers, Fonts, Navbar, and Footer)
  - [x] `page.tsx` (`app/page.tsx` homepage showcase verifying all design tokens and primitives)
- [x] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Reviewed and approved by user.
- [x] **Automated Testing F1 (Sub-phase 2.4):** 21/21 component unit tests passing (Button, Avatar, Badge, Input, MinglerLogo, Navbar).
- [x] **Infrastructure as Code (Sub-phase 2.5):** Multi-stage production `frontend/Dockerfile` and `docker-compose.yml` service configured.
- [x] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Approved by user.

---

### 🔐 Part F2: Authentication Layer, State Management & UK GDPR Profiles
- [x] Build API Client (`lib/api/client.ts`):
  - [x] Axios client configured with base URL (`http://localhost:8000/api/v1/`).
  - [x] Request interceptor attaching `Authorization: Bearer <access_token>`.
  - [x] Response interceptor with automatic SimpleJWT token refresh (`/api/v1/auth/token/refresh/`) on 401 Unauthorized responses with failed request queue.
  - [x] Centralized error handling converting DRF error responses into user-friendly messages.
- [x] Build Authentication Context (`context/auth-context.tsx` & `hooks/use-auth.ts`):
  - [x] Manage `user`, `profile`, `isAuthenticated`, `isLoading`, and `role` (`member`, `venue_manager`, `admin`).
  - [x] Persistent token storage in localStorage with lazy initializers.
  - [x] Login, register, verify email, password reset, logout, and profile refresh actions.
- [x] Build Auth Dialogs & Modals (`components/auth/`):
  - [x] `login-modal.tsx` (email/password form + forgot password & register links).
  - [x] `register-modal.tsx` (name, email, password with automatic transition to OTP verification modal).
  - [x] `verify-email-modal.tsx` (6-digit OTP input boxes, auto-focus, paste support, and 60-second rate-limited resend button).
  - [x] `forgot-password-modal.tsx` (3-step flow: request reset OTP → verify OTP → set new password).
  - [x] `auth-modal-manager.tsx` (globally mounted in Providers).
- [x] Build Member Profile Management (`app/my-mingler/` & `components/profile/`):
  - [x] Profile editor with 18+ age validation on date of birth.
  - [x] Photo URL preview with fallback initials.
  - [x] Social handles input with strict regex validation for Instagram and LinkedIn (**Defect #6 fix**).
  - [x] UK GDPR compliance audit: Public profile cards strictly omit date of birth and email.
  - [x] Hide redundant "Edit Profile" button when Profile tab is active (**Defect #2 fix**).
- [x] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Reviewed and approved by user.
- [x] **Automated Testing F2 (Sub-phase 2.4):** 15 new unit tests (36 total) passing across API client, AuthContext, OTP modal, and ProfileEditor.
- [x] **Infrastructure as Code (Sub-phase 2.5):** `allowedDevOrigins` configured for local LAN IP access (`192.168.0.105`).
- [x] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Approved by user.

---

### 🍷 Part F3: Public Experience Discovery & Venues Directory
- [x] Build Landing Page (`app/page.tsx`):
  - [x] Hero section with London lifestyle typography, primary CTA ("Find your mingle"), and backdrop glow.
  - [x] Curated / Trending Mingles grid with live availability badges and live API integration.
  - [x] "How Mingler Works" 3-step visual guide (Choose, See Who's Going, Connect Double-Blind).
  - [x] Venues highlights and direct routing to `/venues`.
- [x] Build Browse Experiences Page (`app/browse/page.tsx`):
  - [x] Multi-parameter filter bar (`components/mingles/mingle-filter-bar.tsx`):
    - Search input across titles, venues, and areas
    - Experience type filter pills (Dinner Party, Cocktails, Wine Tasting, Brunch, Cooking, etc.)
    - Date range filter (Upcoming, Next 7 days, Next 30 days, All incl. past)
    - London borough/area selector (Shoreditch, Soho, Brixton, Mayfair, Covent Garden, etc.)
    - Age range filter (18-25, 25-35, 35-45, 45-60, 60+)
  - [x] Grid of `MingleCard.tsx` with live spots remaining, pricing in GBP (£), formatted time, and guest blurred slots.
- [x] Build Experience Detail Page (`app/mingles/[id]/page.tsx`):
  - [x] High-resolution hero cover image and venue location badge.
  - [x] Experience overview, 5-tile fact grid (Venue, Date, Time, Duration, Group Size).
  - [x] **Defect #3 Fix (Past Date Lockout Guard):** Join button disabled with "Registration Closed — this experience took place in the past" alert banner.
  - [x] **Defect #5 Fix (Dynamic Attendee Roster):** Live "Who's Going" section querying `/api/v1/mingles/{id}/attendees/` with UK GDPR sanitized attendee cards and guest blur cards.
  - [x] Sticky bottom booking bar with price, spots remaining indicator, and auth modal trigger.
- [x] Build Venues Directory & Detail Pages (`app/venues/page.tsx` & `app/venues/[id]/page.tsx`):
  - [x] London borough filter and venue category search.
  - [x] Venue detail view with hero banner and 7-day operating hours schedule (**Defect #8 fix**).
  - [x] Hosted mingles list at the venue.
  - [x] **Defect #7 Fix (Live Venue Reviews):** Dynamic review list aggregated from 3NF `VenueReview` records with star rating and review submission form.
- [x] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Reviewed and approved by user with filter font scale and mobile/tablet responsive layout fixes.
- [x] **Automated Testing F3 (Sub-phase 2.4):** 21 new unit tests (68 total) passing across `mingle-card.test.tsx`, `mingle-filter-bar.test.tsx`, `attendees-section.test.tsx`, and `venues.test.tsx`.
- [x] **Infrastructure as Code (Sub-phase 2.5):** Multi-stage production `frontend/Dockerfile` and `docker-compose.yml` frontend service verified.
- [x] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Approved by user to proceed to Part F4.

---

### 🎟️ Part F4: Concurrency Booking Engine & Stripe Checkout Flow
- [x] Build Ticket Checkout Drawer / Page (`app/checkout/[id]/page.tsx`):
  - [x] Places selector (1 to 5 seats) with real-time remaining capacity check.
  - [x] Transparent price summary: Ticket unit price × places in GBP (£).
  - [x] Authentication guard: prompts login/registration modal if unauthenticated.
  - [x] Checkout initiation button calling `/api/v1/bookings/{id}/checkout/` and redirecting to Stripe Hosted Checkout.
  - [x] **Defect #3 Fix:** Past date lockout guard banner preventing reservation for past experiences.
- [x] Build Booking Success & Confirmation Page (`app/bookings/[id]/success/page.tsx` & `app/booking-success/page.tsx`):
  - [x] Payment verified screen with booking reference ID.
  - [x] Event details summary (date, start time, venue address).
  - [x] Instant RFC 5545 `.ics` iCalendar download button for Google Calendar, Apple Calendar, and Outlook.
- [x] Build Booking Cancelled Page (`app/bookings/[id]/cancelled/page.tsx`):
  - [x] Aborted checkout handler with retry CTA.
- [x] Build Member Booking Management (`app/my-mingler/page.tsx` - Mingles Tab):
  - [x] Upcoming bookings card list with status badge, venue, and time.
  - [x] Past experiences history.
  - [x] Booking cancellation dialog with confirmation: calls `/api/v1/bookings/{id}/cancel/` and instantly releases reserved capacity.
  - [x] Direct RFC 5545 `.ics` download from member dashboard.
- [x] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Reviewed and verified.
- [x] **Automated Testing F4 (Sub-phase 2.4):** 10 new unit tests (87 total across 18 test files) passing in Vitest; 2 new calendar tests (115 total) passing in Pytest.
- [x] **Infrastructure as Code (Sub-phase 2.5):** All 15 Next.js routes compiled and prerendered in Turbopack build.
- [x] **Base44 Full-Fidelity Alignment & Polish:**
  - [x] Restored light ivory canvas on `/my-mingler` with top `<ProfileSummaryCard />` and horizontal pill tabs (`Profile`, `Mingles`, `Connections`).
  - [x] Demographic age bracket calculation utilities (`calcAgeGroupFromDob`, `calcAgeGroup`) in `lib/utils/age.ts` for UK GDPR compliance.
  - [x] Verified badge component (`VerifiedBadge`) with checkmark shield.
  - [x] Public fellow attendee screen (`/people/[id]`) with visitor gate and "Also attending" mingles list.
  - [x] Dynamic category hero image resolution across Catalog Cards, Detail Hero, Checkout Order Summary, Booking Confirmation, and My Mingler.
  - [x] Live attendee preview avatars (up to 4 members) on browse cards with slot counters and automatic "Be the first to join" clearing.
  - [x] Resolved `ImageFieldFile` serialization crash in `PublicProfileDetailView`.
- [x] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Completed and verified (87/87 Vitest, 115/115 Pytest). Approved to proceed to Part F5.

---

### 🎉 Part F5: Post-Mingle Experience & Double-Blind Mutual Matching
- [x] Build After-Mingle Experience Review (`app/after-mingle/[id]/page.tsx`):
  - [x] **Defect #4 Fix (Attendance-Gated Feedback):** Restricts review access to confirmed attendees; displays friendly message for non-attendees.
  - [x] 5-star experience rating selector with optional feedback comments.
  - [x] Venue rating and review submission (automatically updates venue 3NF score, **Defect #7 fix**).
- [x] Build Double-Blind Mutual Matching Engine:
  - [x] Clean attendee card grid displaying attendee photos and names (with zero PII).
  - [x] Interactive toggle: "Would you like to stay in touch with [Name]?"
  - [x] Submission action: calls `/api/v1/mingles/{id}/select/` to record selections.
- [x] Build Celebration Experience (`components/interactions/connection-celebration.tsx`):
  - [x] **Web Audio API Chime:** Custom synthesized melodic chime via `AudioContext` (safe for iOS Safari without external audio asset downloads).
  - [x] **Confetti Burst:** Multi-stage celebratory confetti explosion (`canvas-confetti`).
  - [x] Instant match reveal screen when mutual picks are detected ($A \leftrightarrow B$).
- [x] Build Member Connections Dashboard (`components/interactions/member-connections-tab.tsx` mounted in `app/my-mingler/page.tsx`):
  - [x] Grid of confirmed mutual connections with Instagram handles, LinkedIn links, and match dates.
  - [x] Direct link from completed past bookings in `MemberBookingsTab` via "Review & Match" button.
- [x] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Reviewed and approved by user.
- [x] **Automated Testing F5 (Sub-phase 2.4):** 13 new unit tests (100 total across 20 test files) passing in Vitest (`tests/interactions.test.tsx` and `tests/celebration.test.tsx`); 115/115 Pytest tests passing.
- [x] **Infrastructure as Code (Sub-phase 2.5):** All 16 Next.js routes compiled cleanly in Turbopack build with zero errors.
- [ ] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Awaiting user approval to proceed to Part F6 (Venue Partner Portal & Founder Admin Dashboard).

---

### 🏢 Part F6: Venue Partner Portal & Founder Admin Dashboard
- [ ] Build Venue Partner Portal (`app/venue/`):
  - [ ] `/venue/register`: Self-service venue application with email verification guard.
  - [ ] `/venue/dashboard`: Venue profile manager (bio, area, category, direct hero image upload).
  - [ ] **Defect #8 Fix (Operating Hours Editor):** 7-day schedule editor using HTML5 `<input type="time">` pickers and accessible "Closed" toggles.
  - [ ] `/venue/submissions`: Experience proposal submission form (title, type, date, time, price, capacity, age range).
- [ ] Build Founder Admin Dashboard (`app/admin/`):
  - [ ] `/admin/approvals`: Curation queues:
    - Pending venues queue: approve / reject with feedback notes.
    - Submitted mingles queue: approve & publish live, reject, or request changes with curator feedback notes.
  - [ ] `/admin/dashboard`: Platform overview metrics (total revenue, active mingles, verified members).
  - [ ] Platform commission fee controller (update percentage with historical audit log).
- [ ] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Review Part F6 portals before proceeding.
- [ ] **Automated Testing F6:** Tests for operating hours validation, proposal submission guards, and admin approval actions.

---

## 📌 Session Handover & Execution Instructions

1. **AI-DLC Protocol Enforcement:** Every sub-phase must begin with `## Current Lifecycle State: Phase X — Sub-phase Y` and halt at gating points.
2. **Defect Zero Guarantee:** Validate each of the 8 resolved Base44 defects in their respective sub-phases.
3. **Continuous Testing:** Run TypeScript typechecks (`npm run build` or `npx tsc --noEmit`) and linting after every sub-phase before presenting the gating point.
