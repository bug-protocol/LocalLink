/**
 * dev-start.js
 * Development launcher: spins up an in-memory MongoDB instance,
 * injects the URI into process.env, then starts the Express server.
 *
 * Usage:  node dev-start.js
 *         (or add "dev": "node dev-start.js" to package.json scripts)
 *
 * Data is ephemeral — it resets every restart. For persistent data,
 * set MONGODB_URI in .env to a real MongoDB Atlas connection string.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const { execSync } = require('child_process');

async function main() {
  // If a real MONGODB_URI is already set in .env, skip the in-memory server
  require('dotenv').config();

  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('127.0.0.1')) {
    console.log('📡 Using real MongoDB URI from .env');
    require('./server');
    return;
  }

  console.log('🧪 No real MongoDB found — starting MongoMemoryServer...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'locallink',
    },
  });

  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  console.log(`✅ MongoMemoryServer started: ${uri}`);
  console.log('⚠️  Data is in-memory — resets on every restart.');
  console.log('   To persist data, set MONGODB_URI in backend/.env to a MongoDB Atlas URI.\n');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await mongod.stop();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await mongod.stop();
    process.exit(0);
  });

  // Boot the server
  require('./server');
}

main().catch((err) => {
  console.error('❌ Failed to start dev server:', err);
  process.exit(1);
});
