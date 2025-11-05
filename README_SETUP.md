# 🚀 ConsenTide - Quick Setup Guide

## 📋 Apa yang Sudah Dikonfigurasi

✅ **Database PostgreSQL** - Replit native PostgreSQL dengan schema lengkap  
✅ **Demo Accounts** - 5 akun demo untuk testing dan judges  
✅ **Authentication** - JWT-based auth dengan bcrypt password hashing  
✅ **API Backend** - Express.js running di port 3001  
✅ **Frontend** - Next.js running di port 5000  
✅ **CORS** - Configured untuk Replit domain  

---

## 🎯 Demo Credentials untuk Judges

Judges bisa langsung login menggunakan akun-akun ini:

### 👤 User Biasa
```
Email:    demo@consentire.com
Password: demo123
```

### 🔧 Administrator
```
Email:    admin@consentire.com
Password: admin123
```

### 🏢 Data Controller
```
Email:    controller@consentire.com
Password: controller123
```

### 👥 Test Users
```
Email:    user1@consentire.com / user2@consentire.com
Password: user123
```

---

## 🔧 JWT_SECRET - Penjelasan

**Apa itu JWT_SECRET?**
- Secret key untuk signing dan verifying authentication tokens
- Hanya digunakan di backend server
- **Judges TIDAK perlu tahu atau menggunakan ini**

**Bagaimana cara kerjanya?**
1. User login dengan email + password
2. Backend verify credentials di database
3. Jika benar, backend generate JWT token (di-sign dengan JWT_SECRET)
4. Token dikirim ke frontend
5. Frontend simpan token dan kirim di setiap request
6. Backend verify token signature menggunakan JWT_SECRET

**Apakah ini mengganggu testing?**
**TIDAK!** JWT_SECRET transparan untuk end-user. Judges hanya perlu:
- Buka aplikasi
- Login dengan email/password
- Sistem otomatis handle token generation

---

## 🗄️ Database Structure

### Tables Created:
- ✅ `users` - User profiles dengan DID
- ✅ `auth_credentials` - Login credentials (email/password hash)
- ✅ `controllers` - Data controller organizations
- ✅ `consents` - Consent records dengan ZK proofs
- ✅ `audit_logs` - Compliance audit trail
- ✅ `governance_proposals` - ElPaca governance
- ✅ `votes` - Voting records

### Sample Data:
- ✅ 5 demo accounts dengan berbagai roles
- ✅ 1 controller organization (Demo Corporation)
- ✅ Sample consent records
- ✅ Ready untuk testing lengkap

---

## 🚀 Running the Application

### Development Mode (Current)
Aplikasi sudah running di Replit dengan:
- Frontend: Port 5000 (webview)
- Backend: Port 3001

### Commands Available:

```bash
# Seed database dengan demo accounts (sudah dirun)
cd backend && npm run seed

# Restart development servers
npm run dev

# Test login endpoint
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@consentire.com","password":"demo123"}'
```

---

## 📦 Migration ke Railway

Lihat file **`RAILWAY_MIGRATION_GUIDE.md`** untuk step-by-step guide:

1. Export database dari Replit
2. Create Railway PostgreSQL
3. Import database ke Railway
4. Deploy backend service
5. Deploy frontend service
6. Configure environment variables
7. Verify everything works

**Key Points:**
- Database structure sama persis (easy migration)
- Demo accounts bisa di-export/import
- Semua environment-based (portable)
- No hardcoded values

---

## 🔐 Security Features

✅ **Password Hashing** - bcrypt dengan 10 rounds  
✅ **JWT Tokens** - Signed dengan secure secret  
✅ **CORS Protection** - Configured origins  
✅ **Rate Limiting** - 120 requests/minute per IP  
✅ **Helmet.js** - Security headers  
✅ **Input Validation** - Zod schemas  

---

## 🧪 Testing Login

### Via API (curl):
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@consentire.com","password":"demo123"}'
```

Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_...",
    "email": "demo@consentire.com",
    "role": "user",
    "did": "did:consentire:user_..."
  }
}
```

### Via Frontend:
1. Buka webview (port 5000)
2. Go to `/login`
3. Enter demo credentials
4. Click login
5. Akan redirect ke dashboard

---

## 📊 Database Access

### Via Replit Database Tool:
1. Click "Database" tab di Replit
2. Query editor tersedia
3. Bisa run SQL queries langsung

### Via psql:
```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# View demo accounts
SELECT email, role FROM auth_credentials;

# View users
SELECT id, email_hash, did FROM users;
```

---

## 🎨 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js)              │
│         Port 5000                       │
│  - Login/Register pages                │
│  - Dashboard                            │
│  - Consent management UI                │
└─────────────────┬───────────────────────┘
                  │ HTTP + JWT
┌─────────────────▼───────────────────────┐
│         Backend (Express)               │
│         Port 3001                       │
│  - /api/v1/auth (login/logout)         │
│  - /api/v1/consent                     │
│  - /api/v1/users                       │
│  - /api/v1/controllers                 │
└─────────────────┬───────────────────────┘
                  │ SQL Queries
┌─────────────────▼───────────────────────┐
│      PostgreSQL Database                │
│  - users, auth_credentials             │
│  - consents, controllers               │
│  - governance, votes                   │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Login tidak berhasil?
- Check database seeding: `cd backend && npm run seed`
- Verify JWT_SECRET is set in environment
- Check backend logs untuk errors

### Database connection error?
- Verify DATABASE_URL exists: `echo $DATABASE_URL`
- Check PostgreSQL service running
- Try reconnecting via Replit Database pane

### CORS errors?
- Verify backend CORS config includes Replit domain
- Check REPLIT_DEV_DOMAIN environment variable
- Restart backend service

### Token verification failed?
- Ensure JWT_SECRET same di backend
- Check token expiration (24 hours default)
- Try login again untuk fresh token

---

## 📁 Important Files

- `DEMO_CREDENTIALS.md` - Complete demo credentials list
- `RAILWAY_MIGRATION_GUIDE.md` - Railway deployment guide
- `backend/src/scripts/seedDemoAccounts.ts` - Database seeding script
- `backend/src/services/authService.ts` - Authentication logic
- `backend/src/routes/auth.ts` - Auth API endpoints
- `database/schema.sql` - PostgreSQL schema definition

---

## ✨ Ready for Judges!

Aplikasi sekarang fully configured dan ready untuk evaluation:

✅ Login system working  
✅ Demo accounts tersedia  
✅ Database populated dengan sample data  
✅ Backend API functional  
✅ Frontend accessible  
✅ Authentication secure  
✅ Easy migration ke Railway  

**Judges tinggal:**
1. Buka aplikasi
2. Login dengan demo credentials
3. Explore features!

---

## 🚂 Next Steps: Deploy ke Railway

Ikuti **RAILWAY_MIGRATION_GUIDE.md** untuk:
1. Export database
2. Setup Railway project
3. Deploy backend & frontend
4. Configure production environment
5. Go live! 🎉

---

**Happy testing! 🎯**
