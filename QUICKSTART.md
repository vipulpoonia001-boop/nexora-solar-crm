# ⚡ Quick Start Guide

## Step 1: Install Dependencies

### Option A: Install everything at once (from root)
```bash
cd nexora-solar
npm run install:all
```

### Option B: Install separately
```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

## Step 2: Start the Application

### Option A: Run both concurrently (from root)
```bash
npm run dev
```

### Option B: Run separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Step 3: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nexorasolar.com | admin123 |
| Staff | staff@nexorasolar.com | staff123 |

## JSON Database Files Location

```
backend/data/
├── leads.json      # Lead records
├── projects.json   # Project records
├── payments.json   # Payment records
├── users.json      # User accounts
└── activities.json # Activity log
```

## Common Issues

### CORS Error
Make sure backend is running on port 5000. The frontend Vite config proxies `/api` to `http://localhost:5000`.

### Port Already in Use
Change the port in `backend/.env` (PORT=5001) and update `frontend/vite.config.js` proxy target.

### Missing Dependencies
If you see module not found errors:
```bash
cd backend && npm install
cd ../frontend && npm install
```
