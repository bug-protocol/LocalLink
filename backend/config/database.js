const mongoose = require('mongoose');
const dns = require('dns');

// Configure public DNS fallback to prevent querySrv ECONNREFUSED on networks with restricted DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (dnsErr) {
  // ignore if in restricted sandbox
}

/**
 * Database connection configuration
 * Supports both standalone Node server and Vercel Serverless Function caching
 */
const connectDB = async () => {
  // Reuse existing connection if already open
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('⚠️  MONGODB_URI environment variable is missing.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Auto-seed starter demo users if database is empty
    try {
      const seedDevData = require('../utils/seedDevData');
      await seedDevData();
    } catch (seedErr) {
      console.warn('Seed notice:', seedErr.message);
    }

    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
