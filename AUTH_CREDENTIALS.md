# Finboard — Auth Credentials (Local Development)

> **Local dev only.** Do not use these values in production. Do not commit real secrets.
> Seed users: `pnpm seed:admin`

---

## App URLs

| App | URL |
|-----|-----|
| Customer web (sign in) | http://localhost:3000/signin |
| API gateway | http://localhost:4000 |
| Auth service | http://localhost:4001 |

---

## Environment secrets (from `.env`)

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb://root:rootpassword@127.0.0.1:27017/kyc-auth-db?authSource=admin` |
| `JWT_SECRET` | `finboard-local-dev-jwt-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `INTERNAL_SERVICE_KEY` | `dev-internal-key` |

---

## Phone OTP (dev fallback)

Twilio is not configured locally. A **random 6-digit OTP** is generated per request.

| Variable | Value |
|----------|-------|
| `TWILIO_OTP_TTL_MINUTES` | `5` |

Find the OTP in the auth-service console:
- Phone OTP: `[DEV] Phone OTP for +91...`
- Password reset: `[DEV] Password reset OTP for email@...`

---

## Email / SMTP

SMTP is not configured locally. Password-reset and notification emails log to the auth/notification service console.

| Variable | Value |
|----------|-------|
| `SMTP_FROM` | `noreply@finboard.local` |

---

## Seeded admin accounts

| Name | Email | Password | Phone | Role |
|------|-------|----------|-------|------|
| KYC Review Admin | `admin@finboard.local` | `Admin@12345` | `+910000000001` | `admin` |
| Operations Admin | `ops.admin@finboard.local` | `OpsAdmin@12345` | `+910000000002` | `admin` |
| RTA Investor Records Admin | `rta.admin@finboard.local` | `RtaAdmin@12345` | `+910000000003` | `rta_admin` |
| AMC Scheme Manager | `amc.admin@finboard.local` | `AmcAdmin@12345` | `+910000000004` | `amc_admin` |

Override any account via env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN2_*`, `RTA_ADMIN_*`, `AMC_ADMIN_*`.

After admin login, the **top navbar** on every `/admin/*` page shows only the modules allowed for that JWT role (e.g. RTA sees KYC + Audit; platform admin sees all five links).

---

## Seeded demo customer accounts

| Name | Email | Password | Phone | PAN | Aadhaar | Role |
|------|-------|----------|-------|-----|---------|------|
| Rahul Sharma | `user@finboard.local` | `User@12345` | `+919876543210` | `ABCPS1234F` | `111222333445` | `user` |
| Priya Singh | `priya@finboard.local` | `User@12345` | `+919876543211` | `PQRPS6789K` | `222333444555` | `user` |

PAN and Aadhaar come from the KYC identity seed (`pnpm seed:kyc`). Name, PAN, and Aadhaar must match exactly when submitting KYC.

Override via: `DEMO_USER_*`, `DEMO_USER2_*`.

---

## Banking API access (by seeded account)

Use these logins when testing `/api/banking/*` in Swagger (`http://localhost:4000/docs`) or Postman.

| Account | Email | JWT `role` | Customer `/api/banking/*` | Admin `/api/banking/admin/*` |
|---------|-------|------------|---------------------------|------------------------------|
| Rahul Sharma | user@finboard.local | `user` | Yes | No |
| Priya Singh | priya@finboard.local | `user` | Yes | No |
| KYC Review Admin | admin@finboard.local | `admin` | No | Yes |
| Operations Admin | ops.admin@finboard.local | `admin` | No | Yes |
| RTA Records Admin | rta.admin@finboard.local | `rta_admin` | No | No |
| AMC Scheme Manager | amc.admin@finboard.local | `amc_admin` | No | No |

**Example:** Sign in as `user@finboard.local`, call `GET /api/banking/demo-accounts` → 200. Sign in as `admin@finboard.local`, same endpoint → 403.

---

## Audit trail (in-app)

View KYC compliance history at **http://localhost:3000/admin/audit** after admin login.

| Account | Can view audit? |
|---------|-----------------|
| `admin@finboard.local` | Yes |
| `rta.admin@finboard.local` | Yes |
| `ops.admin@finboard.local` | Yes |
| `amc.admin@finboard.local` | No |
| Retail users (`user@`, `anurag@`) | No |

API: `GET /api/audit/kyc/{kycApplicationId}` with admin or RTA JWT.

---

## Quick sign-in

**Customer app — Rahul Sharma**

```
Email:    user@finboard.local
Password: User@12345
Phone:    +919876543210
PAN:      ABCPS1234F
Aadhaar:  111222333445
```

**Customer app — Priya Singh**

```
Email:    priya@finboard.local
Password: User@12345
Phone:    +919876543211
PAN:      PQRPS6789K
Aadhaar:  222333444555
```

**Admin (KYC review)**

```
Email:    admin@finboard.local
Password: Admin@12345
```

**RTA admin**

```
Email:    rta.admin@finboard.local
Password: RtaAdmin@12345
```

**AMC admin**

```
Email:    amc.admin@finboard.local
Password: AmcAdmin@12345
```

---

## Reseed auth users

```bash
pnpm seed:admin
```

## Reseed KYC identities (PAN / Aadhaar)

```bash
pnpm seed:kyc
```
