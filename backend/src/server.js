const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');
const connectDb = require('./config/db');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec = require('./docs/swagger');

const app = express();

app.use(helmet());
// Normalize frontend origin and provide a function to validate origins for CORS.
// This ensures the origin has an http/https scheme and avoids passing invalid
// values to the CORS middleware which can cause "URL scheme must be http or https" errors.
const normalizeOrigin = (o) => {
  if (!o) return o;
  if (/^https?:\/\//i.test(o)) return o;
  return `http://${o}`;
};

const frontendOrigin = normalizeOrigin(env.frontendOrigin);

const allowedOrigins = [
  frontendOrigin,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
].filter(Boolean);

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (env.nodeEnv === 'production') {
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed'));
    }

    try {
      const url = new URL(origin);
      if (url.protocol === 'http:' || url.protocol === 'https:') return callback(null, true);
    } catch (err) {
      console.log(err);
    }
    return callback(new Error('CORS: origin not allowed'));
  }
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});
app.use(errorHandler);

// Export the app for serverless adapters (Vercel) and for tests.
module.exports = app;

// If this file is run directly (node src/server.js), connect DB and start the server.
if (require.main === module) {
  connectDb()
    .then(() => {
      app.listen(env.port, env.host, () => {
        console.log(`Server running at http://${env.host}:${env.port}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server', error);
      process.exit(1);
    });
}
