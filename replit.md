# ConsenTide - GDPR Consent Management System

## Overview

ConsenTide is a privacy-first GDPR consent management platform built on Constellation's Hypergraph Transfer Protocol (HGTP). The system enables users to grant, monitor, and revoke data processing permissions across organizations using zero-knowledge proofs for privacy preservation and immutable blockchain anchoring for audit trails.

The application provides three core interfaces:
- **User Dashboard**: Personal consent management and privacy rights enforcement
- **Organization Portal**: GDPR compliance automation and consent request handling
- **Admin Console**: System-wide compliance monitoring and analytics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture (Next.js 14)

**Design Pattern**: Server-side rendering with client-side hydration

The frontend uses Next.js App Router for modern React patterns with file-based routing. Key architectural decisions:

- **Standalone Output**: Configured for containerized deployment on Railway/Docker
- **Static Optimization**: Images are unoptimized for Railway deployment constraints
- **Security Headers**: Custom headers for XSS protection, frame denial, and content-type enforcement
- **Authentication Context**: React Context API manages Supabase auth state globally
- **API Client Layer**: Axios interceptors automatically inject JWT tokens from Supabase sessions

**Why Next.js over SPA**: SSR improves SEO and initial load performance while maintaining dynamic client interactions needed for real-time consent updates.

### Backend Architecture (Node.js + Express)

**Design Pattern**: API Gateway with service-oriented architecture

The backend follows a layered architecture:

1. **Route Layer** (`src/routes/*`): HTTP endpoint handlers with request validation
2. **Service Layer** (`src/services/*`): Business logic isolation for testability
3. **Middleware Layer** (`src/middleware/*`): Cross-cutting concerns (auth, error handling)
4. **Utility Layer** (`src/utils/*`): Shared cryptographic and logging functions

**Key Decisions**:

- **Express over Fastify**: Express chosen for broader ecosystem compatibility and simpler Railway deployment
- **TypeScript**: Strict typing prevents runtime errors in consent state management
- **Modular Services**: Each service (consent, auth, governance) is independently testable
- **ES Modules**: Modern module system for better tree-shaking and deployment optimization

**Alternatives Considered**: NestJS was considered but rejected to minimize deployment complexity within the 48-hour hackathon timeline.

**Security Enhancements (November 2025)**:
- **Server-Side Validation**: All analytics and compliance endpoints validate controller access via JWT
- **Organization Isolation**: Controllers can only access data for their own organizationId
- **Tamper Protection**: Backend resolves controller_hash from JWT organizationId (ignores client params)
- **Access Control**: Returns 403 Forbidden for cross-tenant access attempts with security logging

### Data Storage Solutions

**Primary Database**: PostgreSQL (Railway-hosted)

**Schema Design**:
- `users`: User profiles with DID (Decentralized Identifiers) and public keys
- `auth_credentials`: Email/password authentication with bcrypt hashing
- `consents`: Immutable consent ledger with HGTP transaction hashes
- `controllers`: Organization registry for data processors
- `governance_proposals`: El Paca token-based voting system
- `audit_logs`: Complete consent lifecycle event tracking

**Why PostgreSQL over MongoDB**: ACID compliance is critical for consent records that may be used in legal proceedings. Relational model better represents consent-controller-user relationships.

**Database Migration Strategy**: SQL files in `database/` directory enable version-controlled schema evolution.

### Authentication & Authorization

**Mechanism**: JWT-based authentication with Supabase Auth

**Implementation**:
- Supabase handles user registration, login, and session management
- JWT tokens are issued by Supabase and validated in backend middleware
- Role-based access control (RBAC) uses `role` field in user metadata
- Frontend stores tokens in localStorage with automatic refresh

**Security Measures**:
- Bcrypt password hashing (10 salt rounds)
- JWT expiration (24 hours default, configurable)
- CORS whitelisting for production domains
- Helmet.js security headers
- Rate limiting on authentication endpoints

**Why Supabase over Custom Auth**: Reduces security vulnerabilities, provides OAuth integrations, and eliminates need for password reset infrastructure.

### Cryptographic Services

**Signature Algorithms**:
- **Ed25519**: Primary algorithm for performance-critical operations
- **secp256k1**: Blockchain compatibility for HGTP integration

**Zero-Knowledge Proofs**:
- **Circuit Design**: Circom circuits verify consent without exposing user identity
- **Proof System**: Groth16 via snarkJS for compact proofs
- **Implementation Status**: Placeholder mode for development (full circuit compilation requires circom toolchain)
- **Service**: `realZKService.ts` generates Groth16-compatible proof structures
- **Verification**: Placeholder verification key for development/demo purposes
- **Production Path**: Compile with `circom consent.circom --r1cs --wasm --sym` + snarkjs trusted setup

**Cryptographic Dependencies** (November 2025):
- **@noble/ed25519**: Ed25519 signatures for Constellation transactions (with SHA-512 polyfill via @noble/hashes)
- **@noble/secp256k1**: ECDSA signatures for blockchain compatibility
- **@noble/hashes**: SHA-512 implementation for Node.js environments (required by @noble/ed25519 v2.x)

**Rationale**: Ed25519 provides 128-bit security with smaller signatures than RSA. secp256k1 ensures compatibility with Constellation's blockchain layer.

### Blockchain Integration (Constellation HGTP)

**Service Status**: `realHGTPService.ts` - **FULL PRODUCTION MODE** with Constellation Mainnet

**Implementation**:
- **Anchoring**: All consent records submit real signed transactions to Constellation Mainnet DAG
- **Merkle Proofs**: 16-level merkle tree verification for audit trail compliance
- **WebSocket**: Optional real-time updates (L0 node metadata streaming)
- **No Fallback**: System enforces mainnet connection - throws errors if credentials missing or connection fails

**Network Configuration** (Environment Variables - Required for Production):
- `CONSTELLATION_NODE_URL`: `https://l0-lb-mainnet.constellationnetwork.io` (L0 metadata endpoint)
- `CONSTELLATION_L1_URL`: `https://l1-lb-mainnet.constellationnetwork.io` (L1 DAG transactions)
- `CONSTELLATION_NETWORK_ID`: `1` (mainnet)
- `CONSTELLATION_WALLET_ADDRESS`: **Required** (stored in Replit Secrets)
- `CONSTELLATION_PRIVATE_KEY`: **Required** (stored in Replit Secrets - Ed25519 signing key)
- `CONSTELLATION_PUBLIC_KEY`: **Required** (stored in Replit Secrets)

**Current Mode**: ✅ **PRODUCTION MAINNET** (no simulation capability)
**Security**: All credentials stored in encrypted Replit Secrets, never exposed in code or logs

**Transaction Lifecycle**:
1. Consent granted → HGTP transaction created with Ed25519 signature
2. Transaction validated and signed (enforced - no unsigned transactions allowed)
3. Submitted to Constellation L1 DAG endpoint (`/transactions`)
4. Real transaction hash stored in PostgreSQL `consents.hgtp_tx_hash`
5. UI displays blockchain explorer link: `https://explorer.constellationnetwork.io/transaction/{hash}`

**Production Safeguards** (November 2025):
- **Mandatory Credentials**: Service throws error on startup if keys missing
- **Connection Validation**: L0 node health check required before accepting transactions
- **Signed Transactions Only**: Unsigned transaction fallback removed - all TX must be signed
- **L1 DAG Submission**: Direct submission to mainnet DAG via L1 load balancer

### State Management

**Consent State Machine**:
```
PENDING → GRANTED → [ACTIVE | REVOKED | EXPIRED]
```

**State Transitions**:
- `grantConsent()`: PENDING → GRANTED (with HGTP anchoring)
- `revokeConsent()`: GRANTED → REVOKED (immutable record retained)
- `expireConsent()`: Time-based automatic expiration

**OnChain vs CalculatedState**:
- **OnChainState**: Immutable consent records (consentId, hashes, timestamps)
- **CalculatedState**: Aggregated metrics (compliance scores, active consent counts)

**Design Philosophy**: Immutable audit trail for legal compliance, calculated views for performance.

## External Dependencies

### Third-Party Services

**Supabase** (Authentication & Database)
- **Purpose**: PostgreSQL hosting and user authentication
- **Integration**: `@supabase/supabase-js` client library
- **Environment Variables**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Fallback**: Application gracefully handles Supabase unavailability by rejecting auth requests

**Constellation Network** (HGTP)
- **Purpose**: Immutable consent record anchoring to Mainnet DAG
- **Status**: **PRODUCTION MODE** - `realHGTPService.ts` connected to Constellation Mainnet
- **Current Mode**: ✅ **Live Mainnet Transactions** - All consents anchor to L1 DAG  
- **Integration Point**: `hgtpService.anchorConsent()` submits signed transactions to mainnet

### Core Libraries

**Cryptography**:
- `@noble/ed25519`: EdDSA signatures for Constellation transactions
- `@noble/secp256k1`: ECDSA signatures for blockchain compatibility
- `@noble/hashes`: SHA-512 polyfill for @noble/ed25519 (Node.js requirement)
- `bcryptjs`: Password hashing (10 salt rounds)
- `snarkjs`: Zero-knowledge proof generation
- `circomlib`: Circom circuit utilities

**Web Framework**:
- `express`: HTTP server
- `cors`: Cross-origin resource sharing
- `helmet`: Security headers
- `express-rate-limit`: DDoS protection

**Frontend**:
- `next`: React framework
- `react`: UI library
- `tailwindcss`: Utility-first CSS
- `@headlessui/react`: Accessible UI components
- `axios`: HTTP client

**Validation & Types**:
- `zod`: Runtime type validation
- `typescript`: Static type checking
- `@consentire/shared`: Monorepo shared types

**Database**:
- `pg`: PostgreSQL client
- `@supabase/supabase-js`: Supabase SDK

**Utilities**:
- `winston`: Structured logging
- `jsonwebtoken`: JWT handling
- `uuid`: Unique identifier generation
- `date-fns`: Date manipulation

### API Integrations

**Internal APIs**:
- Backend API Gateway: `http://localhost:3001/api/v1`
- Metagraph endpoints: `http://localhost:9200` (L0 node)

**External APIs** (Planned):
- Constellation Mainnet: `https://l0-lb-mainnet.constellationnetwork.io`
- IPFS Gateway: For ZK circuit distribution

### Database Schema

**Tables**: 8 core tables with 20+ indexes for query optimization

**Critical Indexes**:
- `consents(user_id, status)`: Fast consent lookups
- `consents(controller_hash, status)`: Organization queries by controller hash
- `audit_logs(consent_id, created_at DESC)`: Chronological audit trails

**Constraints**:
- Foreign keys ensure referential integrity
- Unique constraints prevent duplicate consent records
- Check constraints validate enum values (status, role)

**Row-Level Security**: Prepared for Supabase RLS policies to enforce data isolation between users.