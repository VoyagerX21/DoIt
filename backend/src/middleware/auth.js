const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const env = require('../config/env');

async function auth(req, _res, next) {
  const token = req.cookies[env.cookieName];
  if (!token) return next(new ApiError(401, 'Unauthorized'));

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return next(new ApiError(401, 'Unauthorized'));
    req.user = user;
    return next();
  } catch (_error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = auth;
