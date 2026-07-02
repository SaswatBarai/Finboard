# Finboard Monorepo Architecture

Industry-standard layout for a financial platform microservices monorepo.

```
finboard/
├── apps/                    # Frontend applications
│   ├── customer-web/        # Main Next.js app (auth, KYC, banking, investments)
│   ├── admin-web/           # Admin dashboard (planned)
│   └── landing/             # Marketing site (planned)
├── services/                # Backend microservices (same internal layout each)
├── packages/                # Shared libraries
├── infrastructure/          # Docker, K8s, scripts
└── docs/                    # Architecture, API, flows
```

## Service internal layout

Every service follows:

```
service-name/
├── src/
│   ├── app.js               # Express composition
│   ├── server.js            # Bootstrap entry
│   ├── config/
│   ├── bootstrap/           # Local handler registration
│   ├── common/              # Service-local middleware/helpers
│   ├── infrastructure/    # DB, cache, providers
│   └── modules/{domain}/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       ├── routes/
│       ├── validators/
│       └── index.js
├── tests/
├── Dockerfile
└── package.json
```

## Service map

| Service | Port | Domain | Documentation |
|---------|------|--------|---------------|
| api-gateway | 4000 | Routing | [docs/services/api-gateway.md](../services/api-gateway.md) |
| auth-service | 4001 | Users, OTP, JWT | [docs/services/auth-service.md](../services/auth-service.md) |
| profile-service | 4002 | User profiles | [docs/services/profile-service.md](../services/profile-service.md) |
| kyc-service | 4003 | KYC applications | [docs/services/kyc-service.md](../services/kyc-service.md) |
| ocr-service | 4004 | Document OCR (decoupled) | [docs/services/ocr-service.md](../services/ocr-service.md) |
| banking-service | 4005 | Accounts, transfers | [docs/services/banking-service.md](../services/banking-service.md) |
| investment-service | 4006 | Buy, SIP orders | [docs/services/investment-service.md](../services/investment-service.md) |
| notification-service | 4007 | In-app notifications | [docs/services/notification-service.md](../services/notification-service.md) |
| audit-service | 4008 | Audit logs | [docs/services/audit-service.md](../services/audit-service.md) |
| identity-service | 4009 | Seeded identity verification | Planned |
| portfolio-service | 4011 | Holdings | Planned |

See [docs/services/README.md](../services/README.md) for the full service documentation index.

## Inter-service calls

All cross-domain communication uses `@finboard/contracts` HTTP clients with `x-service-key`.

## Run

```bash
cp .env.example .env
pnpm install
pnpm dev
```
