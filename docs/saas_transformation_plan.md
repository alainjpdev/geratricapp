# SaaS Transformation Plan

## Goal Description
Transform the current single-tenant application into a multi-tenant SaaS (Software as a Service) platform. This will allow multiple independent organizations/users to sign up, create their own isolated environment, use the app for a trial period, and then pay for a subscription.

## User Review Required
> [!IMPORTANT]
> **Authentication Overhaul**: The current authentication manually queries a `users` table and stores a simple token. This is insecure for a SaaS. We **strongly recommend** migrating to Supabase Auth (GoTrue) to handle sessions, password recovery, and security automatically.
>
> **Data Isolation**: We must add an `Organization` model and ensure EVERY query is scoped to the user's organization.

## Proposed Changes

### 1. Authentication & Onboarding (Priority)
**Current State**: Custom auth using `bcrypt` and direct DB queries. No session management beyond `localStorage`.
**Target State**: Supabase Auth + Public `users` table synced via Triggers.

#### [NEW] Supabase Auth Integration
- Enable Email/Password provider in Supabase Dashboard.
- Replace `authService.ts` login/register logic with `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`.
- **Triggers**: Create a PostgreSQL trigger to automatically fetch/create a user record in `public.users` when a new user signs up in `auth.users`, assigning them to an `Organization`.

#### [MODIFY] `src/store/authStore.ts`
- Remove manual `bcrypt` usage.
- Use `supabase.auth.getSession()` to restore sessions.
- Store `organizationId` in the Zustand store for easy access in components.

#### [NEW] Onboarding Flow
- **Register Step 1**: User provides Email/Password -> Creates `auth.users` entry.
- **Register Step 2**: User provides Organization Name -> Creates `Organization` and assigns User as Admin.
- **Register Step 3** (Optional): Invite Team Members.

### 2. Database Schema Changes (Multi-tenancy)
#### [NEW] `Organization` Model
```prisma
model Organization {
  id                String   @id @default(uuid())
  name              String
  subscriptionStatus String   @default("trial") // trial, active, canceled
  trialEndsAt       DateTime
  stripeCustomerId  String?
  createdAt         DateTime @default(now())
  
  users             User[]
}
```

#### [MODIFY] Existing Models
- Add `organizationId` column to **ALL** tables (`User`, `Resident`, `Class`, etc.).
- Update RLS policies to check: `auth.uid() -> public.users.id -> organization_id`.

### 3. Subscription & Payment Logic
- **Trial Guard**: Middleware/Component to check `new Date() < organization.trialEndsAt`.
- **Stripe Integration**:
    - Use Stripe Checkout for subscriptions.
    - Webhook to update `Organization.subscriptionStatus`.

### 4. Landing Page
- Update `src/pages/Landing.tsx` with "Start Free Trial" CTA.
- Pricing Section.

## Verification Plan
1.  **Auth Migration**: Register via Supabase Auth. Verify user appears in `auth.users` AND `public.users`.
2.  **Multi-tenancy**:
    - User A (Org A) adds a Resident.
    - User B (Org B) cannot see that Resident.
3.  **Subscription**:
    - Expire a trial manually in DB.
    - User should be redirected to `/billing`.
