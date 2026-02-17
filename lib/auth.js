"use server";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "./db";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dns from "dns";
import { redirect } from "next/navigation";
dns.setDefaultResultOrder("ipv4first");

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // REMOVED unsafe config for production

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
async function isRateLimited(email, ip) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM login_attempts
    WHERE (
        email = ?
        OR ip_address = ?
    )
      AND success = 0
      AND attempt_time > (NOW() - INTERVAL ? MINUTE)
    `,
    [email, ip, WINDOW_MINUTES]
  );

  return rows[0].count >= MAX_ATTEMPTS;
}

// ================= LOGIN =================
export async function login(prevState, formData) {
  try {
    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password");

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    // ✅ Next.js 15 async headers
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";

    // ✅ Rate limit check
    if (await isRateLimited(email, ip)) {
      return { error: "Too many login attempts. Try again later." };
    }

    const [users] = await db.query(
      "SELECT id, password_hash, is_verified FROM users WHERE email = ?",
      [email]
    );

    let success = 0;
    let userId = null;

    if (users.length) {
      const user = users[0];
      userId = user.id;

      const validPassword = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (validPassword) {
        if (!user.is_verified) {
          return { error: "Please verify your email first." };
        }

        success = 1;

        const token = jwt.sign(
          { userId },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // ✅ Next.js 15 async cookies
        const cookieStore = await cookies();

        cookieStore.set("auth_token", token, {
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60,
        });
      }
    }

    // Log every attempt
    await db.query(
      `INSERT INTO login_attempts (email, user_id, ip_address, success)
       VALUES (?, ?, ?, ?)`,
      [email, userId, ip, success]
    );

    if (!success) {
      return { error: "Invalid email or password." };
    }

    return { success: true };

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong." };
  }
}

// ---------------- EMAIL TRANSPORTER ----------------


//
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 👈 add this
  },
});
//
// ================= SIGNUP =================
//
export async function signup(prevState, formData) {
  try {
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim().toLowerCase();
    const role = formData.get("role")?.trim() || "user";
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // ---------------- BASIC VALIDATION ----------------
    if (!name || name.length < 2 || name.length > 100) {
      return { error: "Name must be between 2 and 100 characters." };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Invalid email address." };
    }

    if (!role || role.length > 50) {
      return { error: "Invalid role." };
    }

    if (!password || password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }

    // ---------------- PASSWORD STRENGTH ----------------
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!strongPassword.test(password)) {
      return {
        error:
          "Password must include uppercase, lowercase, number, and special character.",
      };
    }

    // ---------------- HASH PASSWORD ----------------
    const hash = await bcrypt.hash(password, 12);

    let result;
    try {
      [result] = await db.query(
        "INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)",
        [name, email, role, hash]
      );
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return { error: "Email already exists." };
      }
      throw err;
    }

    const userId = result.insertId;

    // ---------------- EMAIL VERIFICATION TOKEN ----------------
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)",
      [userId, token, expiresAt]
    );

    // ---------------- HELPER FOR EMAIL TEMPLATES ----------------
    function getEmailTemplate(heading, content, buttonText, buttonUrl) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .header { background-color: #2f4f2f; padding: 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .content h2 { color: #2f4f2f; margin-top: 0; }
            .button-wrapper { text-align: center; margin: 30px 0; }
            .button { background-color: #2f4f2f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; }
            .button:hover { background-color: #1f3a1f; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #2f4f2f; }
            .text-link { color: #2f4f2f; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CLARITY</h1>
            </div>
            <div class="content">
              <h2>${heading}</h2>
              <p>${content}</p>
              <div class="button-wrapper">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
              </div>
              <p style="font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <a href="${buttonUrl}" class="text-link">${buttonUrl}</a>
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Clarity App. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // ---------------- SEND EMAIL ----------------
    const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

    await transporter.sendMail({
      from: `"Clarity App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: getEmailTemplate(
        `Welcome, ${name}!`,
        "Thank you for signing up to Clarity. To get started, please verify your email address by clicking the button below.",
        "Verify Email",
        verifyLink
      ),
    });

    return {
      success: true,
      message: "Signup successful. Please verify your email.",
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { error: error.message || "Something went wrong during signup." };
  }
}


export async function getCurrentUser() {
  const cookieStore = await cookies();            // ✅ Async Next.js 15
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: payload.userId };            // You can expand this later
  } catch {
    return null; // token invalid or expired
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/auth"); // immediately send user to login page
}
export async function requestPasswordReset(formData) {
  const email = formData.get("email")?.trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  const [users] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  // Always return success (prevent email enumeration attack)
  if (!users.length) {
    return { success: true };
  }

  const userId = users[0].id;

  // Generate secure token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 10);

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.query(
    "INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );

  const resetLink =
    `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${rawToken}&email=${email}`;

  // ---------------- HELPER FOR EMAIL TEMPLATES (Inline duplication to avoid scope issues or need for external file) ----------------
  function getEmailTemplate(heading, content, buttonText, buttonUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .header { background-color: #2f4f2f; padding: 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .content h2 { color: #2f4f2f; margin-top: 0; }
            .button-wrapper { text-align: center; margin: 30px 0; }
            .button { background-color: #2f4f2f; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; }
            .button:hover { background-color: #1f3a1f; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #2f4f2f; }
            .text-link { color: #2f4f2f; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CLARITY</h1>
            </div>
            <div class="content">
              <h2>${heading}</h2>
              <p>${content}</p>
              <div class="button-wrapper">
                <a href="${buttonUrl}" class="button">${buttonText}</a>
              </div>
              <p style="font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <a href="${buttonUrl}" class="text-link">${buttonUrl}</a>
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Clarity App. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;
  }

  const emailHtml = getEmailTemplate(
    "Reset Your Password",
    "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
    "Reset Password",
    resetLink
  );

  await transporter.sendMail({
    from: `"Clarity App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: emailHtml,
  });

  return { success: true };
}
export async function resetPassword(formData) {
  const email = formData.get("email")?.trim().toLowerCase();
  const token = formData.get("token");
  const newPassword = formData.get("password");

  if (!email || !token || !newPassword) {
    throw new Error("Invalid request.");
  }

  const [users] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (!users.length) {
    throw new Error("Invalid or expired reset link.");
  }

  const userId = users[0].id;

  const [rows] = await db.query(
    "SELECT * FROM password_resets WHERE user_id = ? AND expires_at > NOW()",
    [userId]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired reset link.");
  }

  let validToken = false;
  let resetId = null;

  for (const row of rows) {
    const match = await bcrypt.compare(token, row.token_hash);
    if (match) {
      validToken = true;
      resetId = row.id;
      break;
    }
  }

  if (!validToken) {
    throw new Error("Invalid or expired reset link.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.query(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [hashedPassword, userId]
  );

  // Delete used reset token
  await db.query(
    "DELETE FROM password_resets WHERE id = ?",
    [resetId]
  );

  return { success: true };
}
