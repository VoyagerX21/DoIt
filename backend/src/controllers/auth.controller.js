const { z } = require('zod');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const env = require('../config/env');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number')
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[0-9]/, 'Must include a number')
  }),
  query: z.object({}).optional().default({}),
  params: z.object({}).optional().default({})
});

const secureCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Auth: register attempt for', email);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email is already in use');
  }

  const user = await User.create({ name, email, password });
  console.log('Auth: register success for', user._id.toString());
  const token = signToken(user._id.toString());
  res.cookie(env.cookieName, token, secureCookie);

  // Send welcome email asynchronously (don't wait)
  sendWelcomeEmail(user.email, user.name).catch(err => 
    console.error('Failed to send welcome email:', err)
  );

  return res.status(201).json({
    success: true,
    data: { user: { id: user._id, name: user.name, email: user.email } }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Auth: login attempt for', email);
  
  // Check if email and password are provided
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  console.log('Auth: login success for', user._id.toString());

  const token = signToken(user._id.toString());
  res.cookie(env.cookieName, token, secureCookie);

  return res.status(200).json({
    success: true,
    data: { user: { id: user._id, name: user.name, email: user.email } }
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Save token to user
  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = resetPasswordExpires;
  await user.save();

  try {
    // Send email with reset token
    await sendPasswordResetEmail(user.email, resetToken, user.name);
  } catch (error) {
    // Clear the reset token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new ApiError(500, 'Failed to send reset email. Please try again later.');
  }

  return res.status(200).json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link'
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the token to compare with stored hash
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.'
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { path: '/' });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: { id: req.user._id, name: req.user.name, email: req.user.email } }
  });
});

module.exports = { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  register, 
  login, 
  forgotPassword,
  resetPassword,
  logout, 
  me 
};
