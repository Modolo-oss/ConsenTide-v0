# 🚂 Railway Migration Guide - ConsenTide

Panduan lengkap untuk migrate ConsenTide dari Replit PostgreSQL ke Railway PostgreSQL.

## 📋 Prerequisites

- ✅ Akun Railway (https://railway.app)
- ✅ Railway CLI (optional, tapi recommended)
- ✅ Access ke Replit project yang sedang running

---

## 🗄️ Step 1: Export Database dari Replit

### A. Export Schema (Structure)

Jalankan command ini di Replit shell:

```bash
# Export schema saja (tanpa data)
pg_dump $DATABASE_URL --schema-only > consentire_schema.sql

# Atau gunakan file schema yang sudah ada
cp database/schema.sql consentire_schema.sql
```

### B. Export Data

```bash
# Export data dari semua tables
pg_dump $DATABASE_URL --data-only --column-inserts > consentire_data.sql
```

**Alternative:** Export specific tables saja jika ingin selective:

```bash
# Export demo accounts dan data penting
pg_dump $DATABASE_URL \
  --data-only \
  --column-inserts \
  --table=users \
  --table=auth_credentials \
  --table=controllers \
  --table=consents \
  > consentire_essential_data.sql
```

### C. Download Files

1. File akan tersimpan di root project
2. Download via Replit file browser (klik kanan → Download)
3. Simpan di komputer lokal

---

## 🚀 Step 2: Setup Railway Project

### A. Create New Project

1. Login ke Railway: https://railway.app
2. Click **"New Project"**
3. Pilih **"Deploy from GitHub repo"** atau **"Empty Project"**

### B. Add PostgreSQL Database

1. Click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway akan provision PostgreSQL instance
3. Tunggu sampai status **"Active"**

### C. Get Database Credentials

1. Click pada PostgreSQL service
2. Go to **"Variables"** tab
3. Copy semua credentials:
   - `DATABASE_URL` (full connection string)
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

---

## 📥 Step 3: Import Database ke Railway

### Method 1: Via Railway Dashboard (Recommended for beginners)

1. Di Railway PostgreSQL service, click **"Data"** tab
2. Click **"Query"** 
3. Copy-paste isi `consentire_schema.sql`
4. Click **"Run Query"**
5. Tunggu sampai selesai
6. Ulangi untuk `consentire_data.sql`

### Method 2: Via psql (Recommended for advanced users)

Menggunakan credentials dari Railway:

```bash
# Set environment variables
export PGHOST="your-railway-host.railway.app"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASSWORD="your-password"
export PGDATABASE="railway"

# Import schema
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f consentire_schema.sql

# Import data
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f consentire_data.sql
```

### Method 3: Direct connection string

```bash
# Using DATABASE_URL from Railway
psql "postgresql://postgres:password@host.railway.app:5432/railway" -f consentire_schema.sql
psql "postgresql://postgres:password@host.railway.app:5432/railway" -f consentire_data.sql
```

---

## ⚙️ Step 4: Deploy Backend ke Railway

### A. Prepare Backend untuk Deployment

Pastikan `backend/package.json` sudah ada:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### B. Deploy Backend

1. Di Railway, click **"New"** → **"GitHub Repo"** atau **"Empty Service"**
2. Pilih repository ConsenTide
3. Set **Root Directory**: `backend`
4. Railway akan auto-detect Node.js

### C. Configure Environment Variables

Di Backend service, tambahkan variables:

```
# Database (sudah auto-linked jika dari same project)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret
JWT_SECRET=GgpgKgR/A0VmI0P0ZjvxAO4t5D+zfMGujlMzXzxH4Kg=

# Backend Config
PORT=3001
NODE_ENV=production

# CORS (akan diisi setelah frontend deploy)
FRONTEND_URL=https://your-frontend.railway.app
```

### D. Set Build & Start Commands

Railway Settings → Build & Deploy:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

---

## 🎨 Step 5: Deploy Frontend ke Railway

### A. Deploy Frontend

1. Click **"New"** → **"Service"**
2. Pilih same GitHub repo
3. Set **Root Directory**: `frontend`
4. Railway akan auto-detect Next.js

### B. Configure Environment Variables

```
# API Backend URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Frontend Config
NODE_ENV=production
```

### C. Build Configuration

Railway Settings → Build & Deploy:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

---

## 🔗 Step 6: Connect Services

### Update CORS di Backend

Setelah frontend deploy, update environment variable di backend:

```
FRONTEND_URL=https://your-frontend.railway.app
```

Restart backend service.

### Update API URL di Frontend

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

Restart frontend service.

---

## ✅ Step 7: Verify Deployment

### Test Database Connection

```bash
# Connect to Railway PostgreSQL
psql $DATABASE_URL

# Verify tables
\dt

# Check demo accounts
SELECT email, role FROM auth_credentials;
```

### Test Backend API

```bash
# Health check
curl https://your-backend.railway.app/health

# Test login
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@consentire.com","password":"demo123"}'
```

### Test Frontend

1. Buka `https://your-frontend.railway.app`
2. Try login dengan demo credentials
3. Verify semua features working

---

## 🔄 Step 8: Re-seed Database (if needed)

Jika perlu create demo accounts lagi di Railway:

```bash
# Clone repo ke local
git clone your-repo

# Install dependencies
cd backend && npm install

# Set DATABASE_URL to Railway
export DATABASE_URL="postgresql://postgres:password@host.railway.app:5432/railway"

# Run seed script
npm run seed
```

---

## 📊 Database Migration Summary

### What gets migrated:

✅ **Tables:**
- users
- auth_credentials
- controllers
- consents
- audit_logs
- governance_proposals
- votes

✅ **Data:**
- Demo accounts (5 users)
- Sample consents
- Controller organizations

✅ **Indexes:**
- All performance indexes
- Foreign key constraints

---

## 🛡️ Security Checklist

Before going to production:

- [ ] Change JWT_SECRET to new secure value
- [ ] Update all demo account passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Set up proper CORS origins
- [ ] Enable Railway's built-in DDoS protection
- [ ] Set up environment-specific configs
- [ ] Configure backups in Railway
- [ ] Set up monitoring and alerts

---

## 💡 Pro Tips

### 1. Use Railway's Internal Networking

Backend dan Frontend dalam same Railway project bisa communicate via internal URLs:
```
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}
```

### 2. Database Backups

Railway PostgreSQL otomatis create daily backups. Access via:
- Railway Dashboard → PostgreSQL → Backups tab

### 3. Environment Variables

Gunakan Railway's variable references untuk dynamic config:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### 4. Monitoring

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Database connections

### 5. Custom Domains

Untuk production, add custom domain:
1. Railway service → Settings → Domains
2. Add your domain
3. Update DNS records
4. SSL certificates auto-generated

---

## 🆘 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check if tables exist
psql $DATABASE_URL -c "\dt"
```

### Build Failures

- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check build logs in Railway dashboard

### CORS Errors

- Verify FRONTEND_URL in backend env vars
- Check backend CORS configuration
- Ensure protocol matches (http vs https)

### Authentication Issues

- Verify JWT_SECRET is set
- Check database has auth_credentials table
- Verify demo accounts exist

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- ConsenTide Issues: GitHub Issues

---

## ✨ Success!

Setelah semua steps completed, aplikasi ConsenTide Anda sudah fully migrated ke Railway dengan:

✅ PostgreSQL database dengan semua data  
✅ Backend API running di Railway  
✅ Frontend Next.js deployed  
✅ Demo accounts ready untuk judges  
✅ Production-ready infrastructure

**Happy deploying! 🚀**
