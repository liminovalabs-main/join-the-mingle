# Frontend Engineering Development Plan: Next.js 15 + Tailwind CSS

**Project:** Mingler (`mingler.co.uk`) — Custom Dedicated Frontend  
**Framework:** Next.js 15 (App Router, React 19, TypeScript)  
**Styling & UI:** Tailwind CSS 3.4, Radix UI primitives / shadcn/ui, Framer Motion  
**State & Data:** TanStack React Query v5, Context API (Auth/Celebration)  
**Lead Frontend Engineer:** Biplob Hussain  
**Date:** October 2026  

---

## Table of Contents
1. [Frontend Architectural Overview & Directory Hierarchy](#1-frontend-architectural-overview--directory-hierarchy)
2. [Design System & Theme Engine (100% Base44 Visual Parity)](#2-design-system--theme-engine-100-base44-visual-parity)
3. [Page-by-Page 1:1 Implementation Mapping](#3-page-by-page-11-implementation-mapping)
   - 3.1 [Public & Discovery Flow](#31-public--discovery-flow)
   - 3.2 [Member Experience & Ticketing](#32-member-experience--ticketing)
   - 3.3 [After-Mingle Matching & Celebration Engine](#33-after-mingle-matching--celebration-engine)
   - 3.4 [Venue Portal](#34-venue-portal)
   - 3.5 [Founder Admin Portal](#35-founder-admin-portal)
4. [Permanent Resolution of All 8 Client Defects](#4-permanent-resolution-of-all-8-client-defects)
5. [State Management, API Client & JWT Interceptor](#5-state-management-api-client--jwt-interceptor)
6. [Mobile UX, Viewport & Accessibility Hardening](#6-mobile-ux-viewport--accessibility-hardening)
7. [Step-by-Step AI-DLC Development Milestones & Verification Gates](#7-step-by-step-ai-dlc-development-milestones--verification-gates)

---

## 1. Frontend Architectural Overview & Directory Hierarchy

The frontend uses Next.js 15 App Router with a clear separation between Server Components (for fast SEO-friendly public pages) and Client Components (for interactive portals and flows):

```
frontend/
├── app/
│   ├── (public)/                      # Route group for unauthenticated public browsing
│   │   ├── page.tsx                   # Home Page (Hero, Categories, Dynamic MingleCards)
│   │   ├── browse/page.tsx            # Browse Mingles (Search filters, Area pills, Date picker)
│   │   ├── mingles/[id]/page.tsx      # Mingle Details (Gallery, Dynamic Attendees, Sticky CTA)
│   │   ├── venues/page.tsx            # Venue Directory
│   │   ├── venues/[id]/page.tsx       # Venue Details & Dynamic Reviews
│   │   ├── how-it-works/page.tsx      # Educational explainer
│   │   └── about/page.tsx             # Brand story & values
│   ├── (auth)/                        # Authentication routes
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── onboarding/page.tsx        # Profile setup (Photo, verified DOB, gender, bio)
│   ├── (member)/                      # Protected member journeys
│   │   ├── checkout/[id]/page.tsx     # Ticket purchase & Stripe redirect (with past date guard)
│   │   ├── booking-success/page.tsx   # Order confirmation & .ics calendar download
│   │   ├── my-mingler/page.tsx        # Member hub (Mingles, Connections, Profile editor)
│   │   └── after-mingle/[id]/page.tsx # Review & Mutual Matching with Confetti + Web Audio Chime
│   ├── (venue)/                       # Venue Portal
│   │   ├── venue/page.tsx             # Partner landing & registration
│   │   ├── venue/dashboard/page.tsx   # Venue Profile & Time-picker opening hours
│   │   └── venue/submissions/page.tsx # Draft & track mingle submissions
│   ├── (admin)/                       # Founder Admin Portal
│   │   ├── admin/dashboard/page.tsx   # Key metrics & commission fee adjustment
│   │   └── admin/approvals/page.tsx   # Curator review queue for pending venues/mingles
│   ├── layout.tsx                     # Root Layout (Fonts: Archivo + Inter, Global Toaster)
│   ├── error.tsx                      # Root Error Boundary fallback
│   ├── not-found.tsx                  # 404 handler
│   └── globals.css                    # Tailwind directives & CSS custom variables
├── components/
│   ├── common/                        # Navbar, Footer, MobileNav, ErrorBoundary
│   ├── mingles/                       # MingleCard, AttendeesSection, ConnectionCelebration
│   ├── profile/                       # ProfileSummaryCard, ProfileAvatar
│   ├── venue/                         # VenueCard, OpeningHoursPicker, SubmissionsList
│   └── ui/                            # Button, Input, Dialog, Sheet, Tabs, Slider, Badge
├── lib/
│   ├── api/                           # Axios instance with SimpleJWT automatic refresh interceptor
│   ├── celebrationSound.ts            # Web Audio API chime synthesis (iOS Safari hardened)
│   └── validators/                    # Zod schemas for forms (Instagram/LinkedIn handles, times)
├── public/                            # Static logos, favicon, fallbacks
└── tailwind.config.ts
```

---

## 2. Design System & Theme Engine (100% Base44 Visual Parity)

The custom frontend reproduces the exact Mingler design system:

### 2.1 CSS Custom Properties (`styles/globals.css`)
```css
@layer base {
  :root {
    /* Base neutrals */
    --background: 42 39% 94%;           /* Warm Ivory */
    --foreground: 220 12% 10%;          /* Dark Ink */
    --card: 0 0% 100%;
    --card-foreground: 220 12% 10%;

    /* Brand accents */
    --primary: 217 48% 12%;             /* Brand Midnight Navy */
    --primary-foreground: 42 39% 94%;
    --accent: 358 100% 68%;             /* Electric Coral */
    --accent-foreground: 0 0% 100%;
    
    /* Mingler Brand Palette */
    --brand-navy: 217 48% 12%;
    --brand-ivory: 42 39% 94%;
    --brand-coral: 358 100% 68%;
    --brand-blue: 216 33% 49%;
    --brand-stone: 40 14% 83%;
    --brand-ink: 220 12% 10%;
    --brand-green: 217 48% 12%;
    --brand-blush: 14 58% 90%;
    --brand-bg: 42 39% 94%;

    /* Typography */
    --font-heading: 'Archivo', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-script: 'Caveat', cursive;
  }
}
```

---

## 3. Page-by-Page 1:1 Implementation Mapping

### 3.1 Public & Discovery Flow
* **Home Page (`app/(public)/page.tsx`):**
  - Hero with brand title and tagline (*"Meet your people in real life"*).
  - Category filter pills (Food & Drink, Wellness, Arts & Culture, Outdoors, Music, Learning, Social).
  - Responsive grid of `<MingleCard>` components with circular avatar clusters.
  - "How It Works" 3-step teaser.
* **Browse Page (`app/(public)/browse/page.tsx`):**
  - Search bar + London Area filter dropdown + Date Picker + Age Range dual slider.
  - Real-time filtered grid of available experiences.
* **Mingle Detail (`app/(public)/mingles/[id]/page.tsx`):**
  - Hero image + photo gallery carousel.
  - Experience overview, meetup instructions, venue details card.
  - Dynamic `<AttendeesSection>` querying live confirmed bookings.
  - Sticky bottom CTA bar with remaining places count and "Join This Mingle" button (disabled with "This Mingle has concluded" if past date).

### 3.2 Member Experience & Ticketing
* **Checkout Page (`app/(member)/checkout/[id]/page.tsx`):**
  - Selector for 1 to 5 places.
  - Real-time price calculation (places $\times$ unit price).
  - Age eligibility verification against member's verified DOB.
  - Automatic redirect to Stripe Hosted Checkout in GBP (£).
  - Past Date Lockout: Blocks form rendering if `isPast(eventDate)`.
* **Booking Success (`app/(member)/booking-success/page.tsx`):**
  - Animated checkmark celebration.
  - Full booking receipt with date, venue location, and ticket count.
  - One-click "Add to Calendar" (.ics download).

### 3.3 After-Mingle Matching & Celebration Engine
* **After-Mingle Page (`app/(member)/after-mingle/[id]/page.tsx`):**
  - Star rating (1–5) and comment for the experience.
  - Star rating (1–5) and comment for the venue.
  - Grid of fellow attendees with photo, name, and "Mingle Again" selection toggle.
  - Mutual Connection Detection: If a match is detected upon submit, triggers `<ConnectionCelebration>`:
    1. Double-stage brand-colored confetti burst (`canvas-confetti`).
    2. Two-tone rising celebration chime synthesized via Web Audio API (`AudioContext`).
    3. Match dialog displaying the connected member's verified profile and social handle.

---

## 4. Permanent Resolution of All 8 Client Defects

| Defect ID | Issue Description | Root Cause in Base44 | Permanent Fix in Next.js Custom Build |
| :---: | :--- | :--- | :--- |
| **Bug 1** | Multiple profile images distorted on cards | Avatar wrapper lacked `shrink-0 aspect-square`; 50-item query limit truncated list | `<ProfileAvatar>` applies `shrink-0 aspect-square rounded-full object-cover`. MingleCards render dynamic attendees without truncation. |
| **Bug 2** | Redundant "Edit Profile" button on `/my-mingler` | Button rendered persistently while already on Profile tab | Pass `onEdit={tab !== 'profile' ? () => setTab('profile') : undefined}`. Button auto-hides when editing. |
| **Bug 3** | Users can register and pay for past events | Missing date checks on checkout page and backend | Both `/checkout/[id]` and Join button enforce `if (isPast(mingle.event_date))` lockout, displaying "Registration Closed". |
| **Bug 4** | Review submission error on `/after-mingle` | SDK returned direct Array; code read `mine.items[0]` | DRF returns clean typed JSON. Attendance verified against both bookings and attendee records. |
| **Bug 5** | Static "Who's Going" section | Displayed stale array column rather than live bookings | Attendees section queries `/api/v1/mingles/{id}/attendees/` directly from live confirmed bookings. |
| **Bug 6** | Unvalidated Instagram & LinkedIn URLs | Raw text input accepted random strings | Zod regex validation enforces valid handles or HTTPS URLs before enabling the Save button. |
| **Bug 7** | Static venue reviews on Venue Details | After-mingle saved to Feedback but venue read VenueReview | Submitting after-mingle feedback automatically syncs to `VENUE_REVIEWS`, dynamically updating venue ratings. |
| **Bug 8** | Venue opening hours accept arbitrary text | Single unconstrained text input allowed invalid strings | Implemented structured time pickers (`<input type="time" />`) with a "Closed" toggle switch. |

---

## 5. State Management, API Client & JWT Interceptor

### 5.1 Centralized Axios Client (`lib/api/client.ts`)
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Automatic JWT bearer token injection
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Mobile UX, Viewport & Accessibility Hardening

* **Dynamic Viewport Units:** Uses `min-h-[100dvh]` across full-height mobile wrappers to prevent address-bar jitter on iOS Safari and Android Chrome.
* **Safe Area Padding:** Mobile navigation and sticky action bars use `pb-[env(safe-area-inset-bottom)]` to prevent collision with iPhone home indicators.
* **Touch Targets:** All interactive buttons, chips, and links meet WCAG AA standards with minimum dimensions of $44\text{px} \times 44\text{px}$.
* **iOS Safari Audio Autoplay:** `playConnectionChime()` resumes the Web Audio `AudioContext` strictly on the user's submit tap event to comply with mobile audio autoplay policies.

---

## 7. Step-by-Step AI-DLC Development Milestones & Verification Gates

1. **Milestone F1 (Scaffolding & Theme Engine):**
   - Initialize Next.js 15, configure Tailwind CSS variables, fonts (`Archivo`, `Inter`, `Caveat`), and layout primitives.
   - *Verification:* Build compiles cleanly (`npm run build`).
2. **Milestone F2 (Public Catalog & Dynamic Attendee Avatars):**
   - Implement Home, Browse, and Mingle Detail with dynamic `<MingleCard>` and `<AttendeesSection>`.
   - *Verification:* Avatars display as perfect circles on mobile viewport; past events show disabled badges.
3. **Milestone F3 (Checkout & Stripe Redirect):**
   - Implement place selection, price calculation, and Stripe checkout session redirect.
   - *Verification:* Completing a test payment redirects to `/booking-success` with a valid .ics download.
4. **Milestone F4 (After-Mingle Matching & Celebration Engine):**
   - Implement ratings, mutual selections, and celebration modal with confetti and Web Audio chime.
   - *Verification:* Tap gesture produces audible rising chime on real iOS Safari device.
5. **Milestone F5 (Venue & Founder Admin Portals):**
   - Implement venue opening hours time pickers and founder approvals queue.
   - *Verification:* Hours submit cleanly as formatted intervals; founder can approve/request revisions.
