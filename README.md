 # DoIt — Full‑Stack Task Manager

 Comprehensive small task manager built for a technical assessment. This repo contains a Node/Express backend and a Next.js frontend (App Router). The project implements user registration/login, JWT authentication (HttpOnly cookie), forgot-password via Nodemailer, a task CRUD API, and a minimal Next.js client with auth pages and a dashboard.

 **Repository layout**

 ```
 .
 ├── backend/                 # Express API
 │   ├── src/
 │   │   ├── config/         # env, DB config
 │   │   ├── controllers/    # auth.controller, task.controller
 │   │   ├── middleware/     # auth, validate, error handler
 │   │   ├── models/         # User, Task
 │   │   ├── routes/         # auth.routes, task.routes
 │   │   ├── docs/           # swagger.js
 │   │   └── server.js
 │   └── package.json
 ├── frontend/                # Next.js app (App Router)
 │   ├── app/
 │   │   └── auth/           # login, register, forgot/reset pages
 │   ├── components/         # AuthForm, DashboardClient
 │   ├── lib/                # api.js (client API helpers)
 │   └── package.json
 ├── package.json             # workspace scripts
 └── README.md
 ```

 **High level features implemented**
- **User auth:** registration, login, logout, `GET /api/auth/me` to get current user.
- **JWT auth:** JWT tokens are signed server-side and set as an HttpOnly cookie (cookie name configurable).
- **Password reset (Nodemailer):** `forgot-password` generates a time-limited token, emails a reset link using `nodemailer` (`backend/src/utils/email.js`), and `reset-password` accepts token+new password.
- **Email flows:** welcome email on register and password reset email; SMTP configurable through env.
- **Task API:** authenticated CRUD for tasks (create/read/update/delete), with pagination, status filtering and title search.
- **Validation:** request validation using `zod` schemas in controllers and `validate` middleware.
- **Security:** `helmet`, `cors` (credentials-enabled), rate limiting, `express-mongo-sanitize`, `xss-clean`, `hpp`.
- **API docs:** Swagger UI is mounted at `/api-docs` on the backend.

 **Backend implementation notes**
- Controllers: `backend/src/controllers/auth.controller.js` implements `register`, `login`, `forgotPassword`, `resetPassword`, `logout`, `me`.
- Email helpers: `backend/src/utils/email.js` uses Nodemailer; reset link points to the frontend reset route: `${FRONTEND_ORIGIN}/auth/reset-password?token=...`.
- JWT helpers: `backend/src/utils/jwt.js` signs tokens and is used in auth flows and `auth` middleware.
- Models: `User` model stores hashed password, optional `resetPasswordToken` and `resetPasswordExpires`. `Task` model stores title, description, status, owner.
- Errors: `ApiError` utility + central `errorHandler` middleware standardize error responses.

 Tech / libs used (backend)
- express, mongoose, jsonwebtoken, bcryptjs
- nodemailer (emails), zod (validation)
- helmet, cors, express-rate-limit, express-mongo-sanitize, xss-clean, hpp

 Frontend implementation notes
- Next.js App Router structure under `frontend/app/` with dedicated auth pages:
  - `/auth/register` — registration
  - `/auth/login` — login
  - `/auth/forgot-password` — request password reset
  - `/auth/reset-password` — page that consumes the token from the email link
- `frontend/components/AuthForm.js` handles registration/login form UI.
- `frontend/components/DashboardClient.jsx` is the dashboard client component that consumes the Tasks API and requires the user to be authenticated.
- `frontend/lib/api.js` contains API helper functions to call the backend (with credentials) and centralize endpoints.

 Getting started (local dev)

 Prerequisites
- Node.js (v18+ recommended)
- A MongoDB URI (MongoDB Atlas or local)
- SMTP credentials for sending email (or use a testing SMTP service)

 Install dependencies for both workspaces (from repo root):

 ```bash
 npm run install:all
 ```

 Environment variables (backend)

 Create `backend/.env` (copy from `.env.example` if present). Required keys (as used in `backend/src/config/env.js`):

 - `MONGODB_URI` — MongoDB connection string (required)
 - `JWT_SECRET` — strong random secret (required)
 - `JWT_EXPIRES_IN` — token lifetime (default `1d`)
 - `COOKIE_NAME` — cookie name used to store the JWT (default `token`)
 - `FRONTEND_ORIGIN` — frontend origin (e.g. `http://localhost:3000`)
 - `EMAIL_HOST` — SMTP host (e.g. `smtp.gmail.com`)
 - `EMAIL_PORT` — SMTP port (e.g. `587`)
 - `EMAIL_SECURE` — `true` for TLS port, `false` otherwise
 - `EMAIL_USER` — SMTP username
 - `EMAIL_PASSWORD` — SMTP password
 - `EMAIL_FROM` — from address for outgoing mail

 Create frontend environment variables as needed (e.g. `NEXT_PUBLIC_API_URL`), or rely on `FRONTEND_ORIGIN` used by backend emails.

 Run the apps

 From repo root you can run both services using workspace scripts:

 ```bash
 # run backend in dev (nodemon)
 npm run dev:backend

 # run frontend (Next.js)
 npm run dev:frontend
 ```

 By default the frontend runs on `http://127.0.0.1:3000` and the backend on `http://127.0.0.1:5000` (see `backend/src/config/env.js` for defaults).

 API endpoints (high level)

 - Auth:
   - `POST /api/auth/register` — body: `{ name, email, password }` — response sets JWT cookie
   - `POST /api/auth/login` — body: `{ email, password }` — response sets JWT cookie
   - `POST /api/auth/forgot-password` — body: `{ email }` — sends reset email if account exists
   - `POST /api/auth/reset-password` — body: `{ token, password }` — reset password using token
   - `POST /api/auth/logout` — clears cookie
   - `GET  /api/auth/me` — returns current authenticated user

 - Tasks (authenticated):
   - `GET /api/tasks?page=&limit=&status=&search=`
   - `POST /api/tasks` — create
   - `GET /api/tasks/:id` — read
   - `PATCH /api/tasks/:id` — update
   - `DELETE /api/tasks/:id` — delete

 Security & implementation notes
- JWT is stored as an HttpOnly cookie to mitigate XSS-based token theft. Cookie options (sameSite, secure) are set for production safety.
- Passwords are hashed before persisting (bcrypt).
- Forgot-password flow stores a hashed reset token and expiry on the user record; the email contains the raw token in the link and the server validates the hashed token+expiry.
- Email sending errors during registration are logged but do not block registration; errors in reset email will clear the reset token and report failure.

 API docs
- Swagger UI is mounted at `/api-docs` on the backend while running (see `backend/src/docs/swagger.js`).

 Development tips
- If you want to test email flows locally, consider using a test SMTP server like Mailtrap or Ethereal to capture messages.
- To change ports/origins, update `backend/.env` keys or `FRONTEND_ORIGIN`.

 Where to look in the code
- Auth controller: [backend/src/controllers/auth.controller.js](backend/src/controllers/auth.controller.js)
- Email helpers (Nodemailer): [backend/src/utils/email.js](backend/src/utils/email.js)
- JWT helpers: [backend/src/utils/jwt.js](backend/src/utils/jwt.js)
- Frontend auth pages: [frontend/app/auth](frontend/app/auth)
- Dashboard client component: [frontend/components/DashboardClient.jsx](frontend/components/DashboardClient.jsx)

 Want me to:
- run lint and fix formatting
- add a CI workflow for tests and linting
- scaffold Dockerfiles for both services

 If you'd like any of those, tell me which and I'll add them.
