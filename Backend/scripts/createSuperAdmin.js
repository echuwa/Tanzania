/**
 * ═══════════════════════════════════════════════════════════════
 *  MUUNGANO WETU AI — Super Admin Creator
 *  Run this once when setting up the system for a new client:
 *
 *    node scripts/createSuperAdmin.js
 *
 *  This script creates the first administrator account in the DB.
 *  It is safe to run multiple times — it checks if admin exists first.
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');

// ── Inline input if env vars are set (for automated CI/CD deploy) ──
const AUTO_NAME  = process.env.SUPER_ADMIN_NAME;
const AUTO_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const AUTO_PASS  = process.env.SUPER_ADMIN_PASSWORD;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  🇹🇿  MUUNGANO WETU AI — Super Admin Setup');
  console.log('═══════════════════════════════════════════════════════\n');

  // Load models (connects to DB using DATABASE_URL from .env)
  let sequelize, User;
  try {
    const models = require('../models');
    sequelize = models.sequelize;
    User = models.User;
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.\n');
    
    console.log('🔄 Syncing database tables (applying schema upgrades)...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database schema verified and updated.\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Make sure DATABASE_URL is set in your .env file.');
    rl.close();
    process.exit(1);
  }

  // ── Get admin details ──────────────────────────────────────────
  let fullName, email, password;

  if (AUTO_NAME && AUTO_EMAIL && AUTO_PASS) {
    // Non-interactive mode (automated deployment)
    fullName = AUTO_NAME;
    email    = AUTO_EMAIL;
    password = AUTO_PASS;
    console.log(`📋 Using environment variables (non-interactive mode):`);
    console.log(`   Name  : ${fullName}`);
    console.log(`   Email : ${email}\n`);
  } else {
    // Interactive mode
    console.log('Please enter the Super Admin details:\n');

    fullName = (await ask('  Full Name    : ')).trim();
    if (fullName.length < 2) {
      console.error('\n❌ Error: Name must be at least 2 characters.');
      rl.close(); process.exit(1);
    }

    email = (await ask('  Email Address: ')).trim().toLowerCase();
    if (!isValidEmail(email)) {
      console.error('\n❌ Error: Invalid email address format.');
      rl.close(); process.exit(1);
    }

    password = (await ask('  Password     : ')).trim();
    if (password.length < 8) {
      console.error('\n❌ Error: Password must be at least 8 characters.');
      rl.close(); process.exit(1);
    }

    const confirmPw = (await ask('  Confirm PW   : ')).trim();
    if (password !== confirmPw) {
      console.error('\n❌ Error: Passwords do not match.');
      rl.close(); process.exit(1);
    }
  }

  rl.close();

  // ── Check if this email already exists ────────────────────────
  try {
    const existing = await User.findOne({ where: { email } });

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`\n⚠️  An admin with email "${email}" already exists.`);
        console.log(`   Name : ${existing.full_name}`);
        console.log(`   Role : ${existing.role}`);
        console.log('\n   No changes were made. Setup complete.\n');
      } else {
        console.log(`\n⚠️  A user account with email "${email}" already exists (role: ${existing.role}).`);
        console.log('   Please use a different email for the admin account.\n');
      }
      process.exit(0);
    }

    // ── Create the admin ────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      full_name: fullName,
      email,
      password: hashedPassword,
      role: 'admin',
      is_registered: true
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅  SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Name  : ${admin.full_name}`);
    console.log(`  Email : ${admin.email}`);
    console.log(`  ID    : ${admin.id}`);
    console.log('\n  🔐 Save these credentials securely and share with the');
    console.log('     client. Remind them to change the password on first login.\n');

  } catch (err) {
    console.error('\n❌ Error creating admin:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

run();
