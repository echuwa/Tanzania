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
require('dotenv').config();

const { sequelize } = require('./models');
const adminRoutes = require('./routes/adminRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
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

    // Sync database tables without overwriting (no force: true)
    await sequelize.sync();
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      // Start the daily reminder scheduler
      const { startScheduler } = require('./services/schedulerService');
      startScheduler();
    });
  } catch (error) {
    console.error('Unable to connect to the database and start server:', error);
    process.exit(1);
  }
}

startServer();
