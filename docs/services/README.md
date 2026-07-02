# Finboard Services Documentation

Detailed documentation for each backend microservice in the Finboard platform.

| Service | Port | Document |
|---------|------|----------|
| API Gateway | 4000 | [api-gateway.md](./api-gateway.md) |
| Auth Service | 4001 | [auth-service.md](./auth-service.md) |
| Profile Service | 4002 | [profile-service.md](./profile-service.md) |
| KYC Service | 4003 | [kyc-service.md](./kyc-service.md) |
| OCR Service | 4004 | [ocr-service.md](./ocr-service.md) |
| Banking Service | 4005 | [banking-service.md](./banking-service.md) |
| Investment Service | 4006 | [investment-service.md](./investment-service.md) |
| Notification Service | 4007 | [notification-service.md](./notification-service.md) |
| Audit Service | 4008 | [audit-service.md](./audit-service.md) |

## Platform overview

Finboard is a fintech simulation platform for investor onboarding: registration, KYC verification, dummy core banking, and investment flows. All customer traffic enters through the **API Gateway** on port **4000**. Services communicate via HTTP using `@finboard/contracts` clients and optionally via **Kafka** for domain events.

## Related docs

- [Architecture](../architecture/README.md) — monorepo layout and service map
- [FLOW.md](../FLOW.md) — end-to-end platform flows
- [openapi.yaml](../openapi.yaml) — OpenAPI specification (served at `/docs`)

## Run all services

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Individual service:

```bash
pnpm --filter @finboard/auth-service dev
```
