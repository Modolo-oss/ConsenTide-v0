# 🎯 ConsenTide - Demo Credentials for Judges

Welcome to ConsenTide! This document contains all the login credentials you need to test and evaluate the application.

## 📋 Quick Access

All demo accounts are pre-configured and ready to use. Simply navigate to the login page and use any of the credentials below.

---

## 🔐 Demo Accounts

### 👤 Regular User Account
Perfect for testing user-facing features like consent management, viewing granted consents, and revoking permissions.

```
Email:    demo@consentire.com
Password: demo123

Alternative:
Email:    user@consentire.io
Password: user123
```

**What you can do:**
- View all granted consents
- Revoke consent
- See consent history
- Manage personal data preferences

---

### 🔧 Administrator Account
Full access to system administration, analytics, and compliance monitoring.

```
Email:    admin@consentire.com
Password: admin123

Alternative:
Email:    admin@consentire.io
Password: admin123
```

**What you can do:**
- Access admin dashboard
- View system-wide analytics
- Monitor compliance metrics
- Manage all users and controllers
- Generate compliance reports

---

### 🏢 Data Controller Account
Test the organization/controller perspective for managing consent requests and data processing.

```
Email:    controller@consentire.com
Password: controller123

Alternative:
Email:    org@consentire.io
Password: org123
```

**What you can do:**
- View consent requests
- Manage data processing purposes
- Access controller dashboard
- Monitor consent status
- Generate GDPR compliance reports

**Organization:** Demo Corporation / Demo Organization IO  
**Organization ID:** Auto-generated

---

### 🔬 Regulator Account
Special access for regulatory oversight and compliance auditing.

```
Email:    regulator@consentire.io
Password: reg123
```

**What you can do:**
- Access regulatory dashboard
- Audit compliance across all organizations
- View system-wide consent metrics
- Generate compliance reports
- Monitor data processing activities

---

### 👥 Additional Test Users
For testing multi-user scenarios and interactions.

```
User 1:
Email:    user1@consentire.com
Password: user123

User 2:
Email:    user2@consentire.com
Password: user123
```

---

## 🚀 Getting Started

1. **Navigate to the Application**
   - Open your browser
   - Go to the Replit webview or deployment URL

2. **Login**
   - Click "Login" or navigate to `/login`
   - Enter any of the credentials above
   - You'll be redirected to the appropriate dashboard based on your role

3. **Explore Features**
   - Each account type has different views and capabilities
   - Test the consent management workflow
   - Try granting and revoking consents
   - Explore the admin and controller dashboards

---

## 🔍 Key Features to Test

### For Judges Evaluation:

1. **GDPR Compliance** ✅
   - Consent management (grant/revoke)
   - Right to erasure
   - Data portability
   - Audit logs

2. **Zero-Knowledge Proofs** 🔐
   - Privacy-preserving consent verification
   - No plaintext storage of sensitive data
   - Cryptographic proof generation

3. **Hypergraph Integration** 🌐
   - Constellation Network integration
   - Decentralized consent ledger
   - Immutable audit trail

4. **ElPaca Governance** 🦙
   - Decentralized decision-making
   - Token-based voting
   - Privacy policy proposals

---

## 📊 Sample Data

The database is pre-seeded with:
- ✅ 9 demo user accounts (.com and .io domains)
- ✅ 2 controller organizations
- ✅ Sample consent records
- ✅ Audit trail entries

---

## 🛠️ Technical Details

**Database:** PostgreSQL (Replit native)  
**Authentication:** JWT-based with bcrypt hashing  
**Password Hashing:** bcrypt (10 rounds)  
**Session Duration:** 24 hours  
**API Base URL:** http://localhost:3001/api/v1  
**Frontend Port:** 5000

---

## 🔄 Migration to Railway

This application is configured to work seamlessly with PostgreSQL and can be easily migrated to Railway:

1. **Export Database Schema**
   ```bash
   pg_dump $DATABASE_URL --schema-only > schema.sql
   ```

2. **Export Data**
   ```bash
   pg_dump $DATABASE_URL --data-only > data.sql
   ```

3. **Import to Railway PostgreSQL**
   - Create PostgreSQL database in Railway
   - Import schema.sql
   - Import data.sql
   - Update DATABASE_URL environment variable

See `RAILWAY_MIGRATION_GUIDE.md` for detailed instructions.

---

## 🧪 Testing the Login Flow

You can test the login API directly:

```bash
# Test admin login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@consentire.io","password":"admin123"}'

# Expected response:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": {
#     "id": "user_...",
#     "email": "admin@consentire.io",
#     "role": "admin",
#     "did": "did:consentire:..."
#   }
# }
```

---

## 📞 Support

If you encounter any issues:
- Check the application logs in Replit console
- Verify database connection
- Ensure all environment variables are set (JWT_SECRET, DATABASE_URL)
- Check that both backend (port 3001) and frontend (port 5000) are running

---

## 🎉 Thank You!

Thank you for taking the time to evaluate ConsenTide. We hope you find the application innovative and impactful for GDPR compliance and privacy protection!

**Team ConsenTide** 🚀
