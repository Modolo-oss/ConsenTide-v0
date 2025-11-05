# ConsenTide - GDPR Consent Dynamic Ledger

**Zero-knowledge GDPR consent management with immutable audit trails and dynamic revocation capabilities**

## 🎯 Overview

ConsenTide is a privacy-first consent ledger that lets users grant, monitor, and revoke data-processing permissions across any organization—without exposing personal data. Built on Constellation's Hypergraph for true immutability and Metagraphs for custom compliance logic.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  Front-End UI                   │
│  (User Dashboard • Admin Console • API Gateway) │
├─────────────────────────────────────────────────┤
│  ConsenTide Metagraph (Custom Logic + Token)    │
│  ├─ Consent State Engine                        │
│  ├─ ZKP Verification Service                    │
│  ├─ El Paca Governance Module                   │
│  └─ Cross‑Platform API Adapter                  │
├─────────────────────────────────────────────────┤
│         HGTP (Immutable Consent Ledger)         │
│  ├─ Hash‑chained consent records                │
│  ├─ Zero‑knowledge proof anchoring              │
│  └─ Cross‑chain verification endpoints          │
└─────────────────────────────────────────────────┘
```

## 🚀 Features

- 🚧 **Zero-Knowledge Consent Proofs** – Placeholder mode (full circuit compilation pending)
- ✅ **Dynamic Consent Lifecycle** – Grant → Use → Revoke → Audit in real-time
- ✅ **Cross-Platform Integration** – RESTful API for any system (CRM, ERP, marketing tools)
- ✅ **Regulatory Compliance Dashboard** – Real-time GDPR Article 7 & 13 compliance status
- ✅ **Immutable Audit Trail** – Every consent action hash-anchored to HGTP
- ✅ **Token-Governed Privacy** – El Paca used for community voting on privacy policies
- ✅ **Production Database** – Replit PostgreSQL via Supabase client
- ✅ **Authentication** – Email/password + JWT tokens (Supabase Auth integration)
- ✅ **GDPR Compliant Schema** – Complete database schema with proper indexing
- ✅ **Constellation Mainnet Integration** – Live HGTP anchoring to L1 DAG (Network ID: 1)
- 🚧 **Zero-Knowledge Proofs** – Placeholder implementation (full circuits pending)

## 📁 Project Structure

```
Consentire/
├── frontend/          # Next.js React dashboard (User + Admin)
├── backend/           # Node.js Express API Gateway
├── metagraph/         # Scala L0 Metagraph implementation
├── database/          # PostgreSQL schema & migrations
├── shared/           # Shared TypeScript types & validation
├── scripts/          # Deployment & setup scripts
└── docs/             # Comprehensive documentation
```

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide!

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Scala 2.13+ (for Metagraph)
- sbt 1.8+ (for Metagraph)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build shared types:**
   ```bash
   cd shared && npm run build && cd ..
   ```

3. **Run backend API:**
   ```bash
   cd backend && npm run dev
   ```

4. **Run frontend (in new terminal):**
   ```bash
   cd frontend && npm run dev
   ```

5. **Build Metagraph (optional):**
   ```bash
   cd metagraph && sbt compile
   ```

For detailed setup instructions, see [docs/SETUP.md](./docs/SETUP.md).

## 🚀 Production Deployment

### Replit Deployment (Current)
The application is **already deployed and running** on Replit with:
- Frontend: Port 5000 (Next.js)
- Backend: Port 3001 (Express API)
- Database: Managed PostgreSQL
- Constellation: Mainnet credentials in Replit Secrets

### Environment Configuration
See `.env.example` for required environment variables. Critical credentials (Constellation private keys) must be stored in **Replit Secrets**, not in code.

## 🗄️ Database Setup

### Replit PostgreSQL (via Supabase Client)
1. **Database automatically provisioned** by Replit
2. **Environment variables auto-configured** (DATABASE_URL, PGHOST, PGPORT, PGUSER, PGPASSWORD)
3. **Schema**: Legacy SQL schema in `database/schema.sql`
4. **Data Access**: Supabase client services (supabaseConsentService, supabaseControllerService)
5. **Production-ready** with automatic backups

### Manual Schema Setup
```bash
# Run schema manually if needed
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -U $PGUSER -p $PGPORT -d $PGDATABASE -f database/schema.sql
```

## 🔐 Authentication

### Supported Methods
- **Email/Password**: Via Supabase Auth with bcrypt hashing
- **JWT Tokens**: Supabase-issued tokens (24-hour expiration)
- **Role-Based Access Control**: User, Controller, Admin, Regulator roles
- **Optional OAuth**: GitHub, Google (if Supabase configured)

### Demo Accounts
- **Admin**: `admin@consentire.io` / `admin123`
- **User**: `user@consentire.io` / `user123`
- **Organization**: `org@consentire.io` / `org123`
- **Regulator**: `regulator@consentire.io` / `reg123`

## 📖 API Documentation

See [docs/API.md](./docs/API.md) for full API documentation.

## 🏆 Current Status

### ✅ Production Ready (Deployed on Replit)
- **Database Integration**: Replit PostgreSQL accessed via Supabase client
  - Legacy SQL schema in `database/schema.sql`
  - Supabase services layer for data access
- **Authentication System**: Supabase Auth + JWT tokens with bcrypt password hashing
  - Email/password authentication
  - Role-based access control (User, Controller, Admin, Regulator)
- **User Interface**: Complete dashboard and admin console (Next.js 14)
- **API Gateway**: RESTful endpoints for all operations (Express + TypeScript)
- **GDPR Compliance**: Complete schema with proper indexing and audit trails
- **Constellation Mainnet**: LIVE HGTP integration with signed transactions
  - **L0 Endpoint**: https://l0-lb-mainnet.constellationnetwork.io (Node metadata)
  - **L1 Endpoint**: https://l1-lb-mainnet.constellationnetwork.io (DAG transactions)
  - **Network ID**: 1 (Mainnet)
  - **Transaction Signing**: Ed25519 with @noble/ed25519 + SHA-512
  - **No Simulation**: Production-only mode, all consents anchor to real blockchain
- **Production Deployment**: Running on Replit with production credentials in Secrets

### 🚧 In Development
- **ZK Proofs**: Placeholder mode (full circom circuit compilation pending)
  - Service implemented but using simulated proofs
  - Production requires: `circom consent.circom --r1cs --wasm --sym` + snarkjs setup
- **Metagraph**: Scala L0 implementation (optional/not critical for MVP)
  - Code exists in `metagraph/` folder
  - Not actively used (system connects directly to Constellation L0/L1)

### 🎯 Hackathon Demo Ready
- **Working MVP**: End-to-end consent management with real blockchain anchoring
- **Production Database**: Replit PostgreSQL with complete GDPR schema
- **Live Blockchain**: All consent transactions submit to Constellation Mainnet
- **Scalable Architecture**: Modular, maintainable TypeScript codebase
- **Complete Documentation**: Setup guides, API docs, architecture details

## 🔒 Security

- Zero-knowledge proofs (placeholder - full circuits pending)
- SHA-256 hashing for controller identifiers
- Ed25519 signatures for Constellation transactions
- Immutable HGTP anchoring to mainnet
- Bcrypt password hashing (10 salt rounds)
- JWT token-based authentication

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

## 🤝 Contributing

This project is built for the Constellation x LegalTech Hackathon. Contributions welcome!

## 📞 Contact

- GitHub: [ConsenTide](https://github.com/consentire)
- Discord: Constellation Community
