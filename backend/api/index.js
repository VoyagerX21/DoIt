const serverless = require('serverless-http');
const app = require('../src/server');
const connectDb = require('../src/config/db');

// Connect to DB on cold start. Mongoose will reuse the connection across invocations
// when the lambda/container is reused.
connectDb().catch(err => {
  console.error('Failed to connect to DB on startup:', err);
});

module.exports = serverless(app);
