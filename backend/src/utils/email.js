const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailSecure,
  auth: {
    user: env.emailUser,
    pass: env.emailPassword
  }
});

async function sendPasswordResetEmail(email, resetToken, userName) {
  const resetUrl = `${env.frontendOrigin}/auth/reset-password?token=${resetToken}`;

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You recently requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">${resetUrl}</p>
          <p><strong>This link will expire in 30 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email or contact support.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            © 2026 Task Manager. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to: email,
      subject: 'Password Reset Request - Task Manager',
      html: htmlContent,
      text: `Password Reset Request\n\nHello ${userName},\n\nYou recently requested to reset your password. Visit this link to proceed:\n${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this, please ignore this email.`
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendWelcomeEmail(email, userName) {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Task Manager!</h2>
          <p>Hello ${userName},</p>
          <p>Your account has been created successfully. You can now log in and start managing your tasks.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.frontendOrigin}/auth/login" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Login
            </a>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            © 2026 Task Manager. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to: email,
      subject: 'Welcome to Task Manager!',
      html: htmlContent,
      text: `Welcome to Task Manager!\n\nHello ${userName},\n\nYour account has been created successfully. You can now log in and start managing your tasks.\n\nVisit: ${env.frontendOrigin}/auth/login`
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw for welcome email to not block registration
    return false;
  }
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
