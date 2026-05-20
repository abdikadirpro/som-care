# Som Care Pharmacy ERP

Enterprise-grade Pharmacy POS + Inventory + Analytics system.

## Tech Stack
- **Frontend**: React 19 + Vite + Recharts + Framer Motion
- **Backend**: Node.js + Express.js
- **Database**: MySQL + Prisma ORM
- **Auth**: JWT + bcryptjs

## Quick Start

### 1. Database Setup
Create a MySQL database:
```sql
CREATE DATABASE som_care_pharmacy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
```bash
cd backend
npm install
# Edit .env — set your DATABASE_URL
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials
| Role        | Email                      | Password     |
|-------------|----------------------------|--------------|
| Super Admin | admin@somcare.com          | Admin@123    |
| Cashier     | cashier@somcare.com        | Cashier@123  |
| Pharmacist  | pharmacist@somcare.com     | Pharma@123   |

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Prisma Studio: `npm run db:studio` (backend)

## Features
- **POS System** — Barcode scanning, multi-payment, receipt printing
- **Inventory** — Strip/Box/Dozen/Sub-dozen unit support, expiry tracking
- **Analytics** — Hourly/daily/monthly revenue, profit/loss, top medicines
- **Suppliers** — Purchase orders, due payments tracking
- **Customers** — Loyalty points, credit balance, purchase history
- **Prescriptions** — Upload, review workflow
- **Multi-role** — Super Admin, Admin, Manager, Pharmacist, Cashier
