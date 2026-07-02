<div align="center">
 
# Finboard

**Premium demo fintech platform for investor onboarding, identity verification, core banking simulation, and portfolio management.**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-Event_Bus-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org)

<br/>

> **Demo & learning project only.** Does not connect to real banks, UPI, brokers, exchanges, or payment gateways.

</div>

---

## Architecture

![Finboard Architecture](docs/architecture.svg)

<details>
<summary>Mermaid text diagram (GitHub fallback)</summary>

```mermaid
graph TB
    subgraph CLIENT["🖥️  Client Layer"]
        WEB["Next.js 15\ncustomer-web :3000"]
    end

    subgraph GATEWAY["🔀  API Gateway  :4000"]
        GW["api-gateway\nRoute · Auth · Rate-limit"]
    end

    subgraph SERVICES["⚙️  Microservices"]
        direction LR
        AUTH["🔐 auth-service\n:4001"]
        PROFILE["👤 profile-service\n:4002"]
        KYC["📋 kyc-service\n:4003"]
        OCR["🔍 ocr-service\n:4004"]
        BANK["🏦 banking-service\n:4005"]
        INVEST["📈 investment-service\n:4006"]
        NOTIFY["🔔 notification-service\n:4007"]
        AUDIT["📝 audit-service\n:4008"]
    end

    subgraph PACKAGES["📦  Shared Packages"]
        direction LR
        CONTRACTS["contracts"]
        SHARED["shared"]
        LOGGER["logger"]
        ERRORS["errors"]
        KAFKA_PKG["kafka"]
        STORAGE_PKG["storage"]
    end

    subgraph INFRA["🗄️  Infrastructure"]
        direction LR
        MONGO[("MongoDB 7\n:27017")]
        PG[("PostgreSQL 16\n:5432")]
        MINIO["MinIO S3\n:9000"]
        KAFKA_SVC["Apache Kafka\n:9092"]
        ZK["Zookeeper\n:2181"]
    end

    WEB -->|"HTTPS / REST"| GW

    GW --> AUTH
    GW --> PROFILE
    GW --> KYC
    GW --> BANK
    GW --> INVEST
    GW --> NOTIFY

    KYC -->|"OCR job"| OCR
    BANK --> NOTIFY
    INVEST --> BANK
    INVEST --> NOTIFY

    AUTH --> MONGO
    PROFILE --> MONGO
    KYC --> MONGO
    KYC --> MINIO
    OCR --> MINIO
    INVEST --> MONGO
    NOTIFY --> MONGO
    AUDIT --> MONGO
    BANK --> PG

    AUTH --> KAFKA_SVC
    KYC --> KAFKA_SVC
    INVEST --> KAFKA_SVC
    AUDIT --> KAFKA_SVC
    KAFKA_SVC --> ZK

    SERVICES -.->|"workspace:*"| CONTRACTS
    SERVICES -.->|"workspace:*"| SHARED
    SERVICES -.->|"workspace:*"| LOGGER
    SERVICES -.->|"workspace:*"| ERRORS

    style CLIENT fill:#1a1a2e,stroke:#4f46e5,color:#e0e0ff
    style GATEWAY fill:#16213e,stroke:#0ea5e9,color:#e0f2fe
    style SERVICES fill:#0f3460,stroke:#22d3ee,color:#cffafe
    style PACKAGES fill:#1a2744,stroke:#818cf8,color:#e0e7ff
    style INFRA fill:#14142b,stroke:#a78bfa,color:#ede9fe
```

</details>

---

## User Flows

```mermaid
sequenceDiagram
    actor U as User
    participant W as customer-web
    participant GW as api-gateway
    participant A as auth-service
    participant K as kyc-service
    participant O as ocr-service
    participant B as banking-service
    participant I as investment-service

    Note over U,I: 1 · Registration & OTP
    U->>W: Sign up (name, email, phone, password)
    W->>GW: POST /api/auth/send-otp
    GW->>A: forward
    A-->>W: OTP (logged / emailed via Resend)
    U->>W: Enter OTP
    W->>GW: POST /api/auth/verify-otp
    GW->>A: verify hash
    A-->>W: JWT

    Note over U,I: 2 · KYC Submission
    U->>W: Enter PAN + Aadhaar + upload docs
    W->>GW: POST /api/kyc/submit
    GW->>K: save application
    K->>O: trigger OCR job
    O-->>K: extracted fields
    K-->>W: pending status

    Note over U,I: 3 · Bank Verification
    U->>W: Enter account / IFSC
    W->>GW: POST /api/banking/verify
    GW->>B: check seeded accounts (PostgreSQL)
    B->>B: debit ₹2 → auto-refund
    B-->>W: verified

    Note over U,I: 4 · Invest
    U->>W: Buy stock / MF / SIP
    W->>GW: POST /api/investment/order
    GW->>I: place order
    I->>B: deduct from bank balance
    I-->>W: order confirmation + portfolio update
```

---

## Monorepo Layout

```
finboard/
├── apps/
│   └── customer-web/          # Next.js 15 · React 19 frontend
├── services/
│   ├── api-gateway/           # :4000  Central router + auth middleware
│   ├── auth-service/          # :4001  Users · OTP · JWT · Resend email
│   ├── profile-service/       # :4002  Profile completion
│   ├── kyc-service/           # :4003  KYC applications + admin review
│   ├── ocr-service/           # :4004  Tesseract.js + OpenRouter extraction
│   ├── banking-service/       # :4005  Core banking sim (PostgreSQL/Prisma)
│   ├── investment-service/    # :4006  Stocks · MF · SIP · portfolio
│   ├── notification-service/  # :4007  In-app notifications
│   └── audit-service/         # :4008  Immutable audit log
├── packages/
│   ├── contracts/             # HTTP client stubs (inter-service)
│   ├── shared/                # Common types & utilities
│   ├── config/                # Centralised env schema
│   ├── logger/                # Structured logger
│   ├── errors/                # Domain error classes
│   ├── kafka/                 # Kafka producer/consumer helpers
│   ├── storage/               # MinIO S3 wrapper
│   ├── email/                 # Resend email client
│   └── validation/            # Zod schemas
├── infrastructure/
│   ├── docker/                # Dockerfiles
│   └── scripts/               # scaffold-service, e2e-smoke, …
├── docs/architecture/
├── docker-compose.yml         # Infra: MongoDB · PostgreSQL · MinIO · Kafka
├── docker-compose.apps.yml    # Full-stack containers
└── turbo.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, TanStack Query, Recharts, Lucide |
| Backend | Node.js 20, Express 5, Zod, JWT, bcrypt, Mongoose, Prisma |
| Auth | JWT refresh tokens, OTP via **Resend** (email) |
| Databases | MongoDB 7 (auth/profile/KYC/investments), PostgreSQL 16 (banking) |
| Object storage | MinIO (S3-compatible) — KYC documents |
| Event bus | Apache Kafka + Zookeeper |
| OCR / AI | Tesseract.js (local), OpenRouter API (structured extraction) |
| Monorepo | pnpm workspaces, Turborepo |
| Containerisation | Docker Compose |

---

## Prerequisites

- **Node.js 20+** and **pnpm 10+**
- **Docker + Docker Compose** (for local infrastructure)
- Optionally: an [OpenRouter](https://openrouter.ai) API key for AI-assisted OCR extraction

---

## Quick Start

### 1 · Start infrastructure

Spin up MongoDB, PostgreSQL, MinIO, Kafka, and Zookeeper with one command:

```bash
pnpm infra:up
```

### 2 · Install dependencies

```bash
pnpm install
```

### 3 · Configure environment

```bash
cp .env.example .env
cp apps/customer-web/.env.example apps/customer-web/.env.local
```

Edit `.env` — the minimum required variables are marked below.

### 4 · Run database migrations & seeds

```bash
# PostgreSQL schema + seed banking accounts
pnpm prisma:migrate
pnpm seed:banking

# MongoDB seed — dummy identities for KYC demo
pnpm seed:kyc

# Seed admin users
pnpm seed:admin
```

### 5 · Start everything

```bash
pnpm dev
```

This starts all nine services and the Next.js frontend concurrently with labelled, colour-coded output.

| App / Service | URL |
|---|---|
| Customer web | http://localhost:3000 |
| API gateway | http://localhost:4000 |
| Auth service | http://localhost:4001 |
| Profile service | http://localhost:4002 |
| KYC service | http://localhost:4003 |
| OCR service | http://localhost:4004 |
| Banking service | http://localhost:4005 |
| Investment service | http://localhost:4006 |
| Notification service | http://localhost:4007 |
| Audit service | http://localhost:4008 |
| MinIO console | http://localhost:9001 |

---

## Environment Variables

### Root `.env` (shared by all services)

```env
# MongoDB (Docker default)
MONGODB_URI=mongodb://root:rootpassword@127.0.0.1:27017/finboard?authSource=admin

# PostgreSQL — banking service
BANK_DATABASE_URL=postgresql://finboard:finboard_pass@127.0.0.1:5432/finboard_banking?sslmode=disable

# JWT
JWT_SECRET=your-min-32-char-secret-here
JWT_EXPIRES_IN=7d

# Internal service auth
INTERNAL_SERVICE_KEY=dev-internal-key

# Email OTP — Resend (https://resend.com)
RESEND_API_KEY=re_your_key
RESEND_FROM=Finboard <onboarding@resend.dev>
OTP_TTL_MINUTES=5

# MinIO / S3 document storage
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Kafka
KAFKA_BROKERS=127.0.0.1:9092

# OCR / AI extraction (optional — Tesseract runs locally without this)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini

# Rate limiting (relax for local demo)
RATE_LIMIT_MAX=5000
RATE_LIMIT_WINDOW_MS=900000
```

> When `RESEND_API_KEY` is not set, OTPs are printed to the auth-service console — no email account needed for local development.

### `apps/customer-web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Seeded Demo Accounts

Run `pnpm seed:admin` to create these accounts:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@finboard.local` | `Admin@12345` |
| Ops Admin | `ops.admin@finboard.local` | `OpsAdmin@12345` |
| RTA Admin | `rta.admin@finboard.local` | `RtaAdmin@12345` |
| AMC Admin | `amc.admin@finboard.local` | `AmcAdmin@12345` |

> Change these before sharing the project outside local demo mode.

---

## Feature Walkthrough

### Customer onboarding

1. **Sign up** → name, email, phone, password
2. **Verify OTP** → sent via Resend email (printed to console locally)
3. **Complete profile** → address, occupation, income
4. **KYC submission** → PAN + Aadhaar details + document upload
5. **Bank verification** → account number + IFSC → ₹2 debit + auto-refund
6. **Invest** → stocks, mutual funds, SIP — unlocked after KYC approval

### KYC & OCR pipeline

- User uploads PAN and Aadhaar images
- **ocr-service** runs Tesseract.js locally for raw text extraction
- OpenRouter (optional) extracts structured name / PAN / Aadhaar from the raw text
- Admin reviews user-entered values, seeded identity match, OCR output, and uploaded documents side-by-side
- Approve or reject with a single action

### Banking simulation (PostgreSQL)

- Ten seeded dummy bank accounts (run `pnpm seed:banking`)
- Penny-drop verification: ₹2 debit → automatic refund after a short delay
- Beneficiary management, fund transfers, transaction history, banking notifications

### Investment simulation

- Searchable stock and mutual fund marketplace
- Buy stocks, place lump-sum MF orders, create SIP mandates
- Deducts from linked bank balance; updates portfolio and holdings
- AMC admin can review fund/SIP order books and update order status

### Admin dashboard

| Admin role | Access |
|---|---|
| **RTA Admin** | KYC queue, OCR review, document preview, approve/reject |
| **AMC Admin** | Fund order book, SIP book, AUM, scheme analytics |
| **Super Admin** | Both modules |

---

## Available Scripts

```bash
# Development
pnpm dev                  # Start all services + frontend
pnpm dev:web              # Next.js frontend only

# Infrastructure
pnpm infra:up             # Start Docker services (MongoDB, Postgres, MinIO, Kafka)
pnpm infra:down           # Stop Docker services
pnpm infra:apps:up        # Full stack in Docker (services + frontend)
pnpm infra:logs           # Tail Docker logs

# Database
pnpm prisma:migrate       # Deploy PostgreSQL migrations
pnpm prisma:migrate:dev   # Generate + apply new migration
pnpm prisma:generate      # Regenerate Prisma client
pnpm prisma:studio        # Open Prisma Studio
pnpm seed:banking         # Seed 10 dummy bank accounts
pnpm seed:kyc             # Seed dummy PAN/Aadhaar identity records
pnpm seed:admin           # Seed admin users

# Quality
pnpm lint                 # ESLint across all packages
pnpm format               # Prettier write
pnpm test                 # Run all service + web tests
pnpm test:e2e             # End-to-end smoke tests
```

---

## Troubleshooting

### `429 Too Many Requests` on local testing

The gateway rate limiter is active. Set these in `.env` and restart:

```env
RATE_LIMIT_MAX=5000
RATE_LIMIT_WINDOW_MS=900000
```

### CORS error from `127.0.0.1` or port `3001`

Add the exact origin to `CLIENT_ORIGIN` in `.env`:

```env
CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
```

### OTP email not arriving

When `RESEND_API_KEY` is absent, OTPs log to the **auth-service** console:

```
[DEV] Email OTP for user@example.com → 847291
```

### KYC submit returns "identity not found"

The entered name, PAN, and Aadhaar must match a seeded record. Re-run the seed and use those values:

```bash
pnpm seed:kyc
```

### Prisma `P1017` or connection reset

Postgres may have closed the idle connection. Re-run:

```bash
pnpm prisma:generate
```

Then restart the banking-service.

### MongoDB connection fails (Atlas)

- Confirm the database user exists and the password has no unencoded special characters (percent-encode them).
- Check Atlas Network Access → your current IP must be allowed.
- Use exactly one URI; do not prepend `mongodb://localhost` before an Atlas URI.

---

## Security Notes

This is a **simulation project** for demo and learning purposes.

- Do not commit real secrets, API keys, or database passwords.
- Rotate any credentials that were shared in screenshots or public repositories.
- The OTP endpoint returns the generated code in development (`RESEND_API_KEY` absent). Disable this in any exposed environment.
- Default admin passwords are intentionally weak for demo ease — change them before sharing access.

---

<div align="center">

Built with Node.js · Next.js · MongoDB · PostgreSQL · Kafka · MinIO · Docker

</div>
