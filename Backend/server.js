// DNS lookup patch to force IPv4 and bypass node-fetch timeout bug
const dns = require('dns');
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (!options) {
    options = { family: 4 };
  } else if (typeof options === 'object' && options.family === undefined) {
    options.family = 4;
  }
  return originalLookup.call(dns, hostname, options, callback);
};

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Headers (Helmet) ───────────────────────────────────
app.use(helmet());

// ── CORS — Allow only the configured frontend ───────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, webhooks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ── Rate Limiting ───────────────────────────────────────────────
// Strict limit on admin login to block brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts from this IP. Please try again after 15 minutes.' }
});

// General API limiter (generous limit for normal dashboard use)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' }
});

// Apply login rate limiter specifically to the login endpoint
app.use('/api/admin/login', loginLimiter);

// Apply general limiter to all other API routes
app.use('/api/admin', apiLimiter);

// ── Body Parsing ────────────────────────────────────────────────
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);


// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Karibu kwenye MUUNGANO WETU AI Backend Server API 🇹🇿',
    status: 'Running'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Hitilafu ya seva imetokea!' });
});

// Database and Server Start
async function startServer() {
  try {
    console.log('Verifying database connection...');
    await sequelize.authenticate();
    console.log('Database connection verified successfully.');

    // ── DATABASE ENUM SCHEME UPGRADE ──────────────────────────────
    try {
      // Add 'superadmin' to the Postgres enum_users_role if it doesn't exist
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'superadmin') THEN
            ALTER TYPE "enum_users_role" ADD VALUE 'superadmin';
          END IF;
        END
        $$;
      `);
      console.log('Database role enum checked and upgraded to include superadmin.');
    } catch (enumErr) {
      console.log('Role enum upgrade check skipped or type not created yet:', enumErr.message);
    }

    // ── COLUMN MIGRATION: Add verification fields to Users table ──
    try {
      await sequelize.query(`
        ALTER TABLE "users"
          ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN NOT NULL DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS "verification_token" VARCHAR(255),
          ADD COLUMN IF NOT EXISTS "verification_token_expires" TIMESTAMP WITH TIME ZONE;
      `);
      console.log('[Startup] ✅ Verification columns checked/added to Users table.');
    } catch (colErr) {
      console.log('[Startup] Column migration skipped:', colErr.message);
    }

    // ── COLUMN MIGRATION: Add last_active_at field to Users table ──
    try {
      await sequelize.query(`
        ALTER TABLE "users"
          ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP WITH TIME ZONE;
      `);
      console.log('[Startup] ✅ last_active_at column checked/added to Users table.');
    } catch (colErr) {
      console.log('[Startup] Column migration last_active_at skipped:', colErr.message);
    }

    // Sync database tables without overwriting (no force: true)
    await sequelize.sync();
    console.log('Database models synced.');

    // ── DATA MIGRATION: Seed default system settings ──────────────
    try {
      const { SystemSetting } = require('./models');
      const defaultPrompt =
        "You are an AI chatbot named 'MUUNGANO WETU AI' 🇹🇿, and you respond using the unique Persona (voice, wisdom, and polite tone) of the Father of the Nation, Mwalimu Julius Kambarage Nyerere. " +
        "Your primary goal is to educate the youth about the history of the Union of Tanganyika and Zanzibar (officially formed on April 26, 1964), its prominent founders (Mwalimu Julius Nyerere and Mzee Abeid Amani Karume), its importance and benefits, the Articles of Union, and its current progress. " +
        "Speak using the wisdom, respect, and humble politeness of Mwalimu Nyerere (e.g., addressing the user with terms of endearment like 'My friend', 'My young compatriot', 'My child', 'Our nation', or using patriotic wisdom and African proverbs). " +
        "If the user disagrees, says 'NO...', or presents a different historical argument (AI Debate), do not reject them harshly; welcome them with respect, respond using solid historical facts, and encourage critical thinking with utmost gentlemanly politeness. " +
        "Detect the language of the user's message. If they message you in Kiswahili, you MUST respond in fluent, grammatically correct Kiswahili using the unique Persona of Mwalimu Nyerere. If they message you in English, respond in fluent English. Do not mix languages unless quoting standard Swahili proverbs. Always restrict your response to 80-150 words. " +
        "At the end of every response, add a short call-to-action such as: typing QUIZ, STORY, or asking another historical question. " +
        "Do not state false historical facts. If you do not know the answer, state it clearly and guide the user politely.";

      await SystemSetting.findOrCreate({
        where: { key: 'SYSTEM_PROMPT' },
        defaults: { value: defaultPrompt }
      });
      console.log('[Startup] ✅ System Prompt settings seeded successfully.');
    } catch (seedErr) {
      console.error('[Startup] Failed to seed system prompt:', seedErr.message);
    }

    // ── DATA MIGRATION: Mark existing admins as verified ──────────
    // This ensures all pre-existing admin accounts can still log in
    // after the new is_verified security requirement is introduced.
    try {
      const [affectedRows] = await sequelize.query(`
        UPDATE "users"
        SET "is_verified" = TRUE
        WHERE "role" IN ('admin', 'superadmin')
        AND ("is_verified" IS NULL OR "is_verified" = FALSE)
        AND "password" IS NOT NULL;
      `);
      console.log(`[Startup] Verified ${typeof affectedRows === 'number' ? affectedRows : 'existing'} pre-existing admin accounts.`);
    } catch (migrationErr) {
      console.log('[Startup] Admin verification migration skipped:', migrationErr.message);
    }

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      // Start the daily reminder scheduler
      const { startScheduler } = require('./services/schedulerService');
      startScheduler();

      // Start the background job processor
      const { startJobProcessor } = require('./services/jobProcessor');
      startJobProcessor();
    });
  } catch (error) {
    console.error('Unable to connect to the database and start server:', error);
    process.exit(1);
  }
}

startServer();
