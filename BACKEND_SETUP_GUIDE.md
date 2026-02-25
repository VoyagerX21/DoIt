# DoIt Application - Backend Update Guide

## ✅ Changes Made

### 1. **Fixed Login Issue**
- **Problem**: The login validation was too strict for password requirements
- **Solution**: 
  - Updated `loginSchema` to only require minimum 1 character (not 8 with regex patterns)
  - Added explicit null/empty checks for email and password
  - Improved error messages for better debugging
  - Added loading state on frontend to prevent duplicate submissions

### 2. **Added Forgot Password Feature with Nodemailer**

#### Backend Changes:
- ✅ Installed `nodemailer` package
- ✅ Updated User model with password reset fields:
  - `resetPasswordToken` - stores hashed reset token
  - `resetPasswordExpires` - stores token expiration time (30 minutes)
- ✅ Created email utility service (`src/utils/email.js`) with:
  - `sendPasswordResetEmail()` - sends reset link email
  - `sendWelcomeEmail()` - sends welcome email on registration
- ✅ Updated auth controller with new functions:
  - `forgotPassword()` - generates reset token and sends email
  - `resetPassword()` - validates token and updates password
- ✅ Updated auth routes with new endpoints:
  - `POST /api/auth/forgot-password` - request password reset
  - `POST /api/auth/reset-password` - reset password with token
- ✅ Updated environment configuration for email settings

#### Frontend Changes:
- ✅ Enhanced `AuthForm.js`:
  - Added "Forgot Password?" link on login page
  - Improved error handling
  - Added loading state
- ✅ Created `/app/auth/forgot-password/page.js`:
  - Email input form
  - User-friendly instructions
- ✅ Created `/app/auth/reset-password/page.js`:
  - Password reset form with validation
  - Token verification
  - Confirmation to prevent typos

## 🔧 Setup Instructions

### Step 1: Update Backend Environment Variables

Create or update `.env` file in the `backend/` directory:

```env
NODE_ENV=development
HOST=127.0.0.1
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/task_manager?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-recommended
JWT_EXPIRES_IN=1d
COOKIE_NAME=token
FRONTEND_ORIGIN=http://localhost:3000

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@taskmanager.com
```

### Step 2: Configure Gmail for Email Sending

If using Gmail:

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Scroll down to "App passwords"
   - Select Mail and Windows Computer
   - Copy the 16-character password
   - Paste it as `EMAIL_PASSWORD` in your `.env` file

**For Other Email Providers**:
- Gmail SMTP: `smtp.gmail.com` (Port 587)
- Outlook: `smtp-mail.outlook.com` (Port 587)
- SendGrid: `smtp.sendgrid.net` (Port 587)
- AWS SES: `email-smtp.<region>.amazonaws.com` (Port 587)

### Step 3: Update Frontend Environment Variables

Create or update `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000
```

### Step 4: Test the Application

1. **Start Backend**:
```bash
cd backend
npm run dev
```

2. **Start Frontend** (in another terminal):
```bash
cd frontend
npm run dev
```

3. **Test Login Flow**:
   - Go to http://localhost:3000/auth/login
   - Try logging in with valid credentials
   - Try the "Forgot Password?" link

4. **Test Registration**:
   - Go to http://localhost:3000/auth/register
   - Create a new account
   - You should receive a welcome email (if email is configured)

5. **Test Password Reset**:
   - Click "Forgot Password?" on login page
   - Enter your email
   - Check your email for reset link
   - Click the link and set a new password

## 📧 Email Features

### Password Reset Email
- Automatically sent when user requests password reset
- Contains a secure link valid for 30 minutes
- Link includes encrypted reset token
- HTML and plain text versions

### Welcome Email
- Sent when user completes registration
- Does not block registration if email fails
- Contains link to login page

## 🔐 Security Features

1. **Password Reset Token**:
   - Generated using secure random bytes
   - Hashed with SHA-256 before storage
   - Expires after 30 minutes
   - One-time use only

2. **Password Validation**:
   - Minimum 8 characters
   - Must include uppercase letter
   - Must include lowercase letter
   - Must include number
   - Uses bcrypt for storage

3. **CORS & Security**:
   - HttpOnly cookies prevent XSS attacks
   - Secure flag for HTTPS environments
   - SameSite=lax for CSRF protection
   - Rate limiting on API endpoints

## 🐛 Troubleshooting

### Email not sending?
1. Check EMAIL_USER and EMAIL_PASSWORD in `.env`
2. Verify Gmail App Password generation (not regular password)
3. Check email logs: `console.error()` will show SMTP errors
4. Ensure `EMAIL_HOST` and `EMAIL_PORT` are correct for your provider

### Login still not working?
1. Verify user exists in database
2. Ensure password is correct (case-sensitive)
3. Check browser console for specific error message
4. Verify JWT_SECRET is set in `.env` and matches backend

### Frontend not connecting to backend?
1. Verify both servers are running
2. Check NEXT_PUBLIC_API_BASE_URL matches backend URL
3. Check browser console for CORS errors
4. Ensure FRONTEND_ORIGIN in backend `.env` matches frontend URL

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user (requires auth)

## 🚀 Next Steps

1. Configure email provider with your credentials
2. Test all authentication flows
3. Deploy to production with proper environment variables
4. Monitor email logs for delivery issues

---

**Built with**: Node.js, Express, MongoDB, Next.js, JWT, Nodemailer, bcryptjs
