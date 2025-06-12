import { Resend } from "resend";
import crypto from "crypto";

// Initialize Resend (you'll need to add RESEND_API_KEY to .env.local)
const resend = new Resend(process.env.RESEND_API_KEY);

// Fallback email configuration for development
const DEV_MODE = process.env.NODE_ENV === "development";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

export interface VerificationToken {
  token: string;
  expiresAt: Date;
  userId: string;
  email: string;
}

// Generate a secure verification token
export function generateVerificationToken(
  userId: string,
  email: string
): VerificationToken {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

  return {
    token,
    expiresAt,
    userId,
    email,
  };
}

// Create verification URL
export function createVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/auth/verify?token=${token}`;
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  userName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In development mode, just log the verification URL
    if (DEV_MODE && !process.env.RESEND_API_KEY) {
      console.log("\n=== EMAIL VERIFICATION (DEV MODE) ===");
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verificationUrl}`);
      console.log("=====================================\n");

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        error: undefined,
      };
    }

    // Production/configured email sending
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Verify your email address - Habit Tracker",
      html: createVerificationEmailTemplate(
        verificationUrl,
        userName || "there"
      ),
    });

    if (error) {
      console.error("Resend email error:", error);
      return {
        success: false,
        error: error.message || "Failed to send email",
      };
    }

    console.log("✅ Verification email sent successfully:", data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error: any) {
    console.error("Email service error:", error);
    return {
      success: false,
      error: error.message || "Email service failed",
    };
  }
}

// Email template for verification
function createVerificationEmailTemplate(
  verificationUrl: string,
  userName: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .url { word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Habit Tracker</h1>
        <p>Welcome to your journey of building better habits!</p>
      </div>
      
      <div class="content">
        <h2>Hi ${userName}!</h2>
        
        <p>Thanks for signing up for Habit Tracker! To get started, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <div class="url">${verificationUrl}</div>
        
        <p><strong>This link will expire in 24 hours</strong> for security reasons.</p>
        
        <p>If you didn't create an account with us, please ignore this email.</p>
        
        <p>Happy habit building!<br>
        The Habit Tracker Team</p>
      </div>
      
      <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;
}

// Verify token format and expiration
export function verifyToken(
  token: string,
  storedToken: VerificationToken
): { valid: boolean; reason?: string } {
  if (!token || !storedToken) {
    return { valid: false, reason: "Missing token data" };
  }

  if (token !== storedToken.token) {
    return { valid: false, reason: "Invalid token" };
  }

  if (new Date() > storedToken.expiresAt) {
    return { valid: false, reason: "Token expired" };
  }

  return { valid: true };
}
