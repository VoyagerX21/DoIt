const dotenv = require('dotenv');

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  cookieName: process.env.COOKIE_NAME || 'token',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: Number(process.env.EMAIL_PORT || 587),
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@taskmanager.com'
};

['mongoUri', 'jwtSecret'].forEach((key) => {
  if (!env[key]) {
    throw new Error(`Missing required environment variable for ${key}`);
  }
});

module.exports = env;
