# SaaS Architecture & Authentication Reference

This document outlines the technical architecture for transforming the application into a multi-tenant SaaS platform, with a primary focus on the new Authentication and Data Isolation structure.

## 1. Authentication Architecture (Supabase Auth)

We will migrate from the current manual `users` table/`bcrypt` implementation to **Supabase Auth (GoTrue)**. This improves security, handles sessions automatically, and simplifies password recovery.

### New Auth Flow
1.  **Sign Up**: User enters Email/Password in frontend.
2.  **Supabase Auth**: Creates a user in the protected `auth.users` table.
3.  **Database Trigger**: A PostgreSQL trigger detects the new `auth.users` entry and automatically:
    *   Creates a matching record in `public.users`.
    *   Creates a new `Organization` (for the first user) OR assigns the user to an existing Organization (if invited).
4.  **Session**: The frontend receives a JWT containing the `sub` (User ID). Access to data is automatically scoped by this ID.

### `authStore` Update
The global state will be simplified:
*   **Login**: `await supabase.auth.signInWithPassword(...)`
*   **Logout**: `await supabase.auth.signOut()`
*   **Session**: `supabase.auth.onAuthStateChange(...)` listener automatically updates the Zustand store.

## 2. Multi-Tenancy (Data Isolation)

Data isolation is enforced at the Database level using Row Level Security (RLS).

### The `Organization` Model
Every user belongs to an Organization (Tenant).
```prisma
model Organization {
  id                 String   @id @default(uuid())
  name               String
  subscriptionStatus String   @default("trial") // trial, active, canceled
  trialEndsAt        DateTime
  stripeCustomerId   String?
  createdAt          DateTime @default(now())
  
  // Relations
  users              User[]
}
```

### Schema Updates
All major tables must have an `organization_id` column to verify ownership.
*   `User` (already exists, but needs FK to Organization)
*   `Resident` -> adds `organization_id`
*   `Class` -> adds `organization_id`
*   `Client` -> adds `organization_id`

### Row Level Security (RLS)
We will enable RLS on all tables.
*   **Policy**: "Users can only select/insert/update rows where `organization_id` matches their own `organization_id`."
*   **Performance**: The `organization_id` is fetched efficiently via the `public.users` table joined with `auth.uid()`.

## 3. Subscription & Billing

### Trial Logic
*   **New Organization**: Automatically gets 14 days of "Pro" status.
*   **Expiration**: Middleware checks `new Date() > organization.trialEndsAt`.
*   **Block**: If expired, all API requests (except Payment/Profile) return `403 Payment Required`.

### Stripe Integration
*   User clicks "Upgrade" -> Redirects to Stripe Checkout.
*   **Webhook**: Stripe calls our API -> We update `Organization.subscriptionStatus = 'active'`.

## 4. Frontend Routing

### Public Routes
*   `/` (Landing Page)
*   `/login`
*   `/register`
*   `/pricing`

### Protected Routes (Requires Auth & Active Subscription)
*   `/dashboard/*`
*   `/residents/*`
*   `/classes/*`

### Middleware (Route Guards)
1.  **AuthGuard**: Redirects to `/login` if no Session.
2.  **SubscriptionGuard**: Redirects to `/billing` if `organization.subscriptionStatus` is `past_due` or `trial` expired.
