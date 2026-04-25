# ☀️ NEXORA Solar CRM

A full-stack CRM and Project Management System built for solar installation companies. Track leads, manage customer connections, monitor installation progress, handle payments, and manage government processes like net metering and subsidies.

## 📁 Project Structure

```
nexora-solar/
├── backend/
│   ├── controllers/       # Business logic handlers
│   ├── data/             # JSON database files
│   ├── middleware/       # Auth & validation middleware
│   ├── models/           # Database abstraction layer
│   ├── routes/           # API route definitions
│   ├── utils/            # Utility functions
│   ├── server.js         # Main server entry
│   └── package.json
│
└── frontend/
    ├── public/           # Static assets
    └── src/
        ├── components/   # Reusable UI components
        ├── context/      # React context providers
        ├── hooks/        # Custom React hooks
        ├── pages/        # Page components
        ├── utils/        # Helper functions
        ├── App.jsx       # Main app component
        └── main.jsx      # Entry point
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### 1. Clone and Setup

```bash
cd nexora-solar
```

### 2. Start Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Start Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Login

Use demo credentials:
- **Admin**: `admin@nexorasolar.com` / `admin123`
- **Staff**: `staff@nexorasolar.com` / `staff123`

## 📊 Features

### Dashboard
- Real-time KPI cards (Total Leads, Active Projects, Revenue, Conversion Rate)
- Monthly performance charts (Area & Bar charts)
- Alerts panel for pending follow-ups, installations, net metering, subsidies
- Recent activity feed

### Leads Management
- Create, edit, delete leads
- Fields: name, phone, email, address, load requirement (kW), source, status, follow-up date, notes
- Filter by status and source
- Search across all fields
- Sort by any column
- One-click conversion to project
- Import/Export CSV
- Status indicators: new, contacted, interested, converted, rejected

### Projects / Connections
- Automatic project creation on lead conversion
- Track 6 stages: survey → quotation → approved → installation → net metering → completed
- Net meter status: pending, applied, approved, installed
- Subsidy status: not applied, applied, received
- Progress visualization with animated bars
- Quick stage/status updates from grid view
- Equipment tracking (inverter, panel type, panel count)

### Payments Tracking
- Total cost, advance paid, remaining balance
- Payment history with date, amount, method, description
- Visual progress bars showing payment completion
- Add new payments with validation
- Payment status: Paid, Partial, Unpaid

### Data Storage (JSON)
- `leads.json` - Lead records with timestamps
- `projects.json` - Project details and stage tracking
- `payments.json` - Payment records and history
- `users.json` - User accounts with bcrypt passwords
- `activities.json` - Audit log of all actions

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin/staff)
- Protected routes
- Secure password hashing with bcrypt

### UI/UX
- Clean, modern dashboard with Tailwind CSS
- Responsive sidebar navigation (collapsible on desktop, drawer on mobile)
- Color-coded status badges
- Smooth transitions and hover effects
- Custom scrollbar styling
- Toast notifications

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get current user |
| POST | `/api/auth/users` | Create user (admin only) |

### Leads
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List all leads (with filters) |
| GET | `/api/leads/stats` | Lead statistics |
| GET | `/api/leads/:id` | Get single lead |
| POST | `/api/leads` | Create lead |
| PUT | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |
| POST | `/api/leads/:id/convert` | Convert lead to project |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/stats` | Project statistics |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| PATCH | `/api/projects/:id/stage` | Update stage |
| PATCH | `/api/projects/:id/netmeter` | Update net meter status |
| PATCH | `/api/projects/:id/subsidy` | Update subsidy status |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List all payments |
| GET | `/api/payments/stats` | Payment statistics |
| GET | `/api/payments/:id` | Get single payment |
| POST | `/api/payments` | Add payment |
| PUT | `/api/payments/:id` | Update payment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Full dashboard data |

## 🗄️ Database Schema

### Lead
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "loadRequirement": "number (kW)",
  "source": "enum",
  "status": "new|contacted|interested|converted|rejected",
  "followUpDate": "YYYY-MM-DD",
  "notes": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Project
```json
{
  "id": "uuid",
  "leadId": "uuid",
  "customerName": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "systemSize": "number (kW)",
  "inverter": "string",
  "panelType": "string",
  "panelCount": "number",
  "stage": "survey|quotation|approved|installation|net metering|completed",
  "netMeterStatus": "pending|applied|approved|installed",
  "subsidyStatus": "not applied|applied|received",
  "startDate": "YYYY-MM-DD",
  "expectedCompletion": "YYYY-MM-DD",
  "actualCompletion": "YYYY-MM-DD",
  "notes": "string",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Payment
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "customerName": "string",
  "totalCost": "number",
  "advancePaid": "number",
  "remainingBalance": "number",
  "paymentHistory": [
    {
      "id": "uuid",
      "date": "YYYY-MM-DD",
      "amount": "number",
      "method": "Cash|Bank Transfer|UPI|Cheque|Card",
      "description": "string"
    }
  ],
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

## 🔄 Automation Features

1. **Lead Conversion**: When a lead is converted, automatically creates:
   - Project entry with lead data
   - Payment record with estimated cost
   - Activity log entry

2. **Alerts System**: Dashboard shows alerts for:
   - Overdue follow-ups (red priority)
   - Today's follow-ups (yellow priority)
   - Pending installations
   - Pending net metering applications
   - Pending subsidy applications

3. **Activity Logging**: All actions are automatically logged:
   - Lead created/updated/deleted
   - Lead converted to project
   - Payment received
   - Project stage updated
   - Project completed

## 📈 Scalability Path

The JSON file-based storage is designed to be easily upgraded:

1. **Replace Database Layer**: Swap `models/db.js` with MongoDB/Mongoose or Sequelize/Prisma
2. **Keep Controllers**: Business logic remains the same
3. **Keep Routes**: API structure is database-agnostic
4. **Migration**: Write a one-time script to import JSON files into new database

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express 5 |
| Auth | JWT + bcryptjs |
| Database | JSON files (fs/promises) |
| Validation | express-validator |

## 📄 License

MIT License - Built for solar installation businesses worldwide.
