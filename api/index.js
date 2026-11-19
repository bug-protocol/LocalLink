const connectDB = require('../backend/config/database');
const app = require('../backend/server');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
  }
  return app(req, res);
};
