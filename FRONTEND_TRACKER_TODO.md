# Project Mingler: Frontend Engineering Progress Tracker & Task Register

**Project:** Mingler (`mingler.co.uk`) — Full-Stack Rebuild (Frontend Application)  
**Framework Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, TanStack React Query v5, Radix UI, Framer Motion, Web Audio API  
**Status:** Phase 1: Inception — Sub-phase 1.2 Module Breakdown (Awaiting User Approval Gate)  
**Last Updated:** October 2026  

---

## 📊 High-Level Frontend Milestone Overview

| Part | Milestone / Module | Target Architecture & Core Scope | Implementation State | Verification & Testing State |
|---|---|---|---|---|
| **Part F1** | **Design System Foundation & Global Navigation** | "Digital Atelier" palette (`brand-navy`, `brand-coral`, `brand-ivory`), Archivo & Inter typography, responsive Navbar, Footer, and Radix UI primitives. | ✅ **Complete** | ✅ 21/21 Passing (100%) |
| **Part F2** | **Authentication Layer, API Client & UK GDPR Profiles** | Axios/Fetch client with SimpleJWT 15-min auto-refresh, Login, 6-Digit Email OTP verification modal, Password Reset, OAuth2 Socials, Private Profile editor, and zero-PII sanitization. | ⏳ Queued | ⏳ Awaiting F1 |
| **Part F3** | **Public Experience Discovery & Venues Directory** | Homepage (Hero, category pills, curated carousel), Browse Experiences with multi-facet filters, Mingle Details with dynamic attendee roster (Defect #5 fix) and past date lockout guard (Defect #3 fix), Venues Directory with 7-day operating schedule. | ⏳ Queued | ⏳ Awaiting F2 |
| **Part F4** | **Booking Engine & Stripe Checkout Flow** | Places selector (1-5), real-time price calculations in GBP (£), Stripe Checkout session initiation, Booking confirmation with dynamic `.ics` calendar invitation download, and member booking dashboard with instant capacity release on cancellation. | ⏳ Queued | ⏳ Awaiting F3 |
| **Part F5** | **Post-Mingle Experience & Double-Blind Mutual Matching** | Attendance-gated experience feedback (Defect #4 fix), 3NF venue reviews (Defect #7 fix), double-blind attendee selection grid ($A \leftrightarrow B$), Web Audio API `AudioContext` celebration chime, two-stage confetti burst, and connections dashboard. | ⏳ Queued | ⏳ Awaiting F4 |
| **Part F6** | **Venue Partner Portal & Founder Admin Dashboard** | Self-service venue registration with email verification check, 7-day operating hours time-pickers (Defect #8 fix), mingle proposal submissions, founder curation & approval queues (approve, reject, changes requested with curator notes), and platform fee manager with audit trail. | ⏳ Queued | ⏳ Awaiting F5 |

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
- [ ] 🛑 **AI-DLC Sub-phase 2.5 Gating Point**: Awaiting user approval to proceed to Part F2.

---

### 🔐 Part F2: Authentication Layer, State Management & UK GDPR Profiles
- [ ] Build API Client (`lib/api/client.ts`):
  - [ ] Axios/Fetch client configured with base URL (`http://localhost:8000/api/v1/`).
  - [ ] Request interceptor attaching `Authorization: Bearer <access_token>`.
  - [ ] Response interceptor with automatic SimpleJWT token refresh (`/api/v1/auth/token/refresh/`) on 401 Unauthorized responses.
  - [ ] Centralized error handling converting RFC 7807 responses into user-friendly toasts.
- [ ] Build Authentication Context (`context/AuthContext.tsx` & `hooks/useAuth.ts`):
  - [ ] Manage `user`, `profile`, `isAuthenticated`, `isLoading`, and `role` (`member`, `venue_manager`, `admin`).
  - [ ] Persistent token storage in secure HTTP cookies / localStorage.
  - [ ] Login, register, logout, and profile refresh actions.
- [ ] Build Auth Dialogs & Modals (`components/auth/`):
  - [ ] `LoginModal.tsx` (email/password form + OAuth2 social buttons for Google, Apple, Facebook, Instagram, TikTok, LinkedIn).
  - [ ] `RegisterModal.tsx` (name, email, password with automatic transition to OTP verification modal).
  - [ ] `VerifyEmailModal.tsx` (6-digit OTP input boxes, auto-focus, countdown timer, and 60-second rate-limited resend button).
  - [ ] `ForgotPasswordModal.tsx` (3-step flow: request reset OTP → verify OTP → set new password).
  - [ ] `SocialAuthHandler.tsx` (handles OAuth2 redirects and popup message listeners).
- [ ] Build Member Profile Management (`app/my-mingler/` & `components/profile/`):
  - [ ] Profile editor with 18+ age validation on date of birth.
  - [ ] Multipart direct photo upload with instant image preview.
  - [ ] Social handles input with strict Zod regex validation for Instagram and LinkedIn (**Defect #6 fix**).
  - [ ] UK GDPR compliance audit: Public profile cards strictly omit date of birth and email.
  - [ ] Hide redundant "Edit Profile" button when Profile tab is active (**Defect #2 fix**).
- [ ] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Review Part F2 Auth implementation before proceeding.
- [ ] **Automated Testing F2:** Unit tests for token refresh interceptor, OTP countdown timer, and form validation schemas.

---

### 🍷 Part F3: Public Experience Discovery & Venues Directory
- [ ] Build Landing Page (`app/page.tsx`):
  - [ ] Hero section with London lifestyle typography, primary CTA ("Explore Experiences"), and search bar.
  - [ ] Experience category pills (Dinner Party, Cocktail Evening, Wine Tasting, Cooking, Cultural).
  - [ ] Curated / Trending Mingles grid with live availability badges.
  - [ ] "How Mingler Works" 3-step visual guide (Choose, Mingle, Connect).
  - [ ] Featured London Venues carousel with borough highlights.
- [ ] Build Browse Experiences Page (`app/browse/page.tsx`):
  - [ ] Multi-parameter filter sidebar & mobile sheet:
    - London borough/area filter (Shoreditch, Mayfair, Soho, Covent Garden, etc.)
    - Date range calendar picker
    - Experience type filter
    - Price range slider in GBP (£)
  - [ ] Grid of `MingleCard.tsx` with live spots remaining, pricing, time, and sold-out states.
- [ ] Build Experience Detail Page (`app/mingles/[id]/page.tsx`):
  - [ ] High-resolution hero gallery and venue location badge.
  - [ ] Experience overview, curated menu/details, age range, and dress code.
  - [ ] **Defect #3 Fix (Past Date Lockout Guard):** Join button disabled with "Registration Closed" banner for past events.
  - [ ] **Defect #5 Fix (Dynamic Attendee Roster):** Live "Who's Going" section querying `/api/v1/mingles/{id}/attendees/` with sanitized attendee cards.
  - [ ] Sticky bottom booking bar on mobile with price and spots remaining.
- [ ] Build Venues Directory & Detail Pages (`app/venues/page.tsx` & `app/venues/[id]/page.tsx`):
  - [ ] London borough filter and venue category search.
  - [ ] Venue detail view with 7-day operating hours schedule.
  - [ ] **Defect #7 Fix (Live Venue Reviews):** Dynamic review list aggregated from 3NF `VenueReview` records with average star rating.
- [ ] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Review Part F3 catalog implementation before proceeding.
- [ ] **Automated Testing F3:** Tests for filtering logic, past date guard disable state, and dynamic attendee list rendering.

---

### 🎟️ Part F4: Concurrency Booking Engine & Stripe Checkout Flow
- [ ] Build Ticket Checkout Drawer / Page (`app/checkout/[id]/page.tsx`):
  - [ ] Places selector (1 to 5 seats) with real-time remaining capacity check.
  - [ ] Transparent price summary: Ticket unit price × places + booking fee in GBP (£).
  - [ ] Authentication guard: prompts login/registration modal if unauthenticated.
  - [ ] Checkout initiation button calling `/api/v1/bookings/{id}/checkout/` and redirecting to Stripe Hosted Checkout.
- [ ] Build Booking Success & Confirmation Page (`app/booking-success/page.tsx`):
  - [ ] Payment verified screen with booking reference ID.
  - [ ] Event details summary (date, start time, venue address, directions).
  - [ ] Instant RFC 5545 `.ics` iCalendar download button for Google Calendar, Apple Calendar, and Outlook.
- [ ] Build Member Booking Management (`app/my-mingler/page.tsx` - Mingles Tab):
  - [ ] Upcoming bookings card list with QR code / ticket pass.
  - [ ] Past experiences history.
  - [ ] Booking cancellation dialog with confirmation: calls `/api/v1/bookings/{id}/cancel/` and instantly releases reserved capacity.
- [ ] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Review Part F4 booking flow before proceeding.
- [ ] **Automated Testing F4:** Tests for seat bounds validation (1-5), price math calculations, and cancellation handling.

---

### 🎉 Part F5: Post-Mingle Experience & Double-Blind Mutual Matching
- [ ] Build After-Mingle Experience Review (`app/after-mingle/[id]/page.tsx`):
  - [ ] **Defect #4 Fix (Attendance-Gated Feedback):** Restricts review access to confirmed attendees; displays friendly message for non-attendees.
  - [ ] 5-star experience rating selector with optional feedback comments.
  - [ ] Venue rating and review submission (automatically updates venue 3NF score).
- [ ] Build Double-Blind Mutual Matching Engine:
  - [ ] Clean attendee card grid displaying attendee photos and names (with zero PII).
  - [ ] Interactive toggle: "Would you like to stay in touch with [Name]?"
  - [ ] Submission action: calls `/api/v1/interactions/after-mingle/{id}/submit/` to record selections.
- [ ] Build Celebration Experience (`components/mingles/ConnectionCelebration.tsx`):
  - [ ] **Web Audio API Chime:** Custom synthesized melodic chime via `AudioContext` (safe for iOS Safari without external audio asset downloads).
  - [ ] **Confetti Burst:** Multi-stage celebratory confetti explosion (`canvas-confetti`).
  - [ ] Instant match reveal screen when mutual picks are detected ($A \leftrightarrow B$).
- [ ] Build Member Connections Dashboard (`app/my-mingler/page.tsx` - Connections Tab):
  - [ ] Grid of confirmed mutual connections with Instagram handles, LinkedIn links, and match dates.
  - [ ] "Mark celebrated" status trigger.
- [ ] 🛑 **AI-DLC Sub-phase 2.3 Gating Point**: Review Part F5 matching flow before proceeding.
- [ ] **Automated Testing F5:** Tests for attendance gating, mutual match state handling, and Web Audio API fallback.

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
