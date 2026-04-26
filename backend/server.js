import { config as loadEnv, parse as parseEnv } from 'dotenv';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { db } from './models/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '.env');

try {
  loadEnv({ path: ENV_PATH, override: true });
  const rawEnv = readFileSync(ENV_PATH, 'utf8');
  const parsedEnv = parseEnv(rawEnv);
  console.log(`Loaded backend env from: ${ENV_PATH}`);

  // Ensure critical variables are synced to process.env
  for (const key of ['MONGO_URI', 'MONGODB_URI', 'DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[key] && parsedEnv[key]) {
      process.env[key] = parsedEnv[key];
    }
  }

  const rawFallback = Array.from(rawEnv.matchAll(/^(MONGO_URI|MONGODB_URI|DATABASE_URL|JWT_SECRET)\s*=\s*(.*)$/gim));
  for (const [, key, value] of rawFallback) {
    if (!process.env[key]) {
      process.env[key] = value.trim();
    }
  }
} catch (err) {
  console.warn('⚠️  Notice: .env file not found or unreadable. Using system environment variables.');
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'nexora_dev_secret_key_change_in_production';
console.log(`MONGO_URI: ${process.env.MONGO_URI ? 'Configured' : 'Not found (falling back to JSON mode)'}`);

const DATA_FILES = {
  leads: 'leads.json',
  projects: 'projects.json',
  payments: 'payments.json',
  users: 'users.json',
  activities: 'activities.json',
  settings: 'settings.json'
};

const syncLocalDataToMongo = async () => {
  if (!mongoUri) return;

  for (const [collection, filename] of Object.entries(DATA_FILES)) {
    const existingCount = await db.count(collection);
    if (existingCount === 0) {
      try {
        const jsonPath = join(__dirname, 'data', filename);
        const fileContents = await readFile(jsonPath, 'utf8');
        const docs = JSON.parse(fileContents);
        if (Array.isArray(docs) && docs.length > 0) {
          console.log(`Seeding ${docs.length} documents into Mongo collection: ${collection}`);
          await db.write(collection, docs);
        }
      } catch (seedError) {
        console.error(`Failed to seed ${collection} to MongoDB:`, seedError.message);
      }
    }
  }
};

import authRoutes from './routes/auth.js';
import leadsRoutes from './routes/leads.js';
import projectsRoutes from './routes/projects.js';
import paymentsRoutes from './routes/payments.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 5000;
const DEFAULT_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'https://nexora-solar-crm.onrender.com'
];
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_ORIGINS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Configure Email Transporter once
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log(`📧 Email Server is ready to send messages from: ${process.env.EMAIL_USER}`);
  }
});

// ✅ MongoDB Connection (optional)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('MongoDB Connected ✅');
      await syncLocalDataToMongo();
    })
    .catch(err => console.error('MongoDB Error ❌:', err));
} else {
  console.warn('⚠️  MONGO_URI is not configured. Running in JSON-file database mode only.');
}

// Initialize database based on mode
if (!process.env.MONGO_URI) {
  db.init()
    .then(() => {
      console.log('JSON Database initialized');
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
    });
} else {
  console.log('Using MongoDB - skipping JSON database initialization');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl/postman/server-to-server).
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-Email Quotation Endpoint
app.post('/api/projects/:id/email-quotation', async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfBase64 } = req.body;

    const project = await db.findById('projects', id);
    if (!project || !project.email) {
      return res.status(404).json({ error: 'Project or Customer Email not found' });
    }

    if (!process.env.EMAIL_USER) {
      return res.status(500).json({ error: 'System configuration error: Missing sender credentials' });
    }

    const mailOptions = {
      from: `"Nexora Power" <${process.env.EMAIL_USER}>`,
      to: project.email,
      subject: `Solar Quotation - ${project.customerName}`,
      text: `Dear ${project.customerName},\n\nPlease find the attached quotation for your ${project.systemSize}kW solar installation.\n\nBest regards,\nNexora Power Team`,
      attachments: [
        {
          filename: `Quote_${project.customerName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64.split("base64,")[1],
          encoding: 'base64'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    
    // Log the activity
    await db.insert('activities', {
      description: `Quotation emailed to ${project.customerName} for ${project.systemSize}kW system`,
      type: 'email_sent',
      projectId: id,
      customerName: project.customerName
    });
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('📧 Nodemailer Error Detail:', {
      code: error.code,
      command: error.command,
      response: error.response
    });

    let friendlyMessage = 'Failed to send email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      friendlyMessage = 'Email authentication failed. The server app-password may be incorrect or expired.';
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      friendlyMessage = 'Could not connect to the email server. Please check your internet connection.';
    } else if (error.code === 'EENVELOPE') {
      friendlyMessage = 'The customer email address appears to be invalid.';
    }

    res.status(500).json({ error: friendlyMessage, technical: error.code });
  }
});

// 👇 ADD THIS HERE
app.get("/", (req, res) => {
  res.send("NEXORA Solar API is running 🚀");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`NEXORA Solar API running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

export default app;
