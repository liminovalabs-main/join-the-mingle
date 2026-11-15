# Stripe Payment Integration Specification — Mingler

This specification records the technical and business requirements for the Stripe integration based on client requirements provided by Karim (Mingle Ltd) on 11 November 2026.

---

## 1. Account & Legal Entity

- **Legal Entity:** Mingle Ltd
- **Trading Name:** Mingler
- **Website:** `https://mingler.co.uk`
- **Stripe Profile:** `@mingler_social`
- **Brand Colors:**
  - Navy: `#202636`
  - Coral: `#E16766`
- **Account Verification:** Complete (no outstanding verification requirements).

---

## 2. API Credentials & Key Management

### Required Keys
1. **Publishable Key (`pk_...`):** For client-side Checkout session redirection.
2. **Restricted Secret API Key (`rk_...`):** For backend Stripe API interactions.
3. **Webhook Signing Secret (`whsec_...`):** For HMAC signature verification on webhook events (`Stripe-Signature` header).

> [!IMPORTANT]
> Both **Test Mode (`pk_test_`, `rk_test_`, `whsec_test_`)** and **Live Mode (`pk_live_`, `rk_live_`, `whsec_...`)** keys are required. All integration tests must be completed end-to-end in Stripe Test/Sandbox mode before running real financial transactions.

### Key Permissions Needed on Restricted API Key:
- **Checkout Sessions:** Write (`checkout:sessions:write`)
- **Payment Intents:** Read/Write (`payment_intents:read`, `payment_intents:write`)
- **Customers:** Read/Write (`customers:read`, `customers:write`)
- **Refunds:** Read/Write (`refunds:read`, `refunds:write`)
- **Webhooks:** Read (`webhook_endpoints:read`)

---

## 3. Webhook Endpoint Configuration

- **Target Endpoint:** `https://api.mingler.co.uk/api/v1/payments/webhook/`
- **Destination Name:** `Mingler Website - Live Payments`
- **Stripe API Version:** `2026-10-28.endive`
- **Enabled Webhook Events:**
  1. `checkout.session.completed`: Marks the booking as confirmed, triggers attendee confirmation email, increments attendee count.
  2. `payment_intent.succeeded`: Verifies payment settlement and logs idempotent transaction ID.
  3. `charge.refunded`: Handles automated or admin-initiated refunds, cancels booking places, and notifies customer.

---

## 4. Payment & Financial Flow Architecture

### 4.1 Launch Architecture (Direct Merchant Payments)
- **Customer Transaction:** Customer books tickets and pays `Ticket Price + £2.00 Booking Fee` in a single checkout.
- **Funds Destination:** 100% of customer funds settle directly into Mingle Ltd's Stripe bank account.
- **Revenue Retention:** Mingle Ltd retains:
  - The £2.00 booking fee.
  - The agreed commission rate per venue agreement (e.g., 10%–20%).
- **Venue Payouts:** Venue partners will be paid manually offline by Mingle Ltd via direct bank transfer according to each partner's commercial schedule.

### 4.2 Future Phase Architecture (Stripe Connect Ready)
- The backend data model and business logic are architected to support **Stripe Connect** without major redesign:
  - Venue profile includes commission rate fields and Stripe Connected Account ID (`stripe_account_id`).
  - Separation of ticket price, booking fee, platform fee, and vendor net payout.
  - Automated payout scheduling and reconciliation tracking.

---

## 5. Cancellation & Refund Policy

Provisional policy rules to enforce in the backend:
1. **> 48 hours prior to experience start:**
   - Full refund granted to customer (including the £2.00 booking fee).
2. **Within 48 hours (< 48 hours):**
   - Non-refundable to the customer.
   - **Exceptions:** Full refund granted if Mingler cancels the event, the venue cancels the event, or the host declines a booking request.
3. **Configurability:**
   - The cancellation window (default 48 hours) must be configurable at both the platform level and overridden per venue or experience if required.

---

## 6. Security & Credential Delivery

- Credentials must **never** be sent over unencrypted plain email.
- **Delivery Method:** Shared Google Doc with restricted View/Comment access to `liminovalabs@gmail.com`.
