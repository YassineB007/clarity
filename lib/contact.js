"use server";

import db from "./db";
import nodemailer from "nodemailer";
import { headers } from "next/headers";

export async function sendContactMessage(prevState, formData) {
  try {
    /* ===============================
       1️⃣ Get & Sanitize Inputs
    =============================== */

    const name = formData.get("name")?.trim();
    const surname = formData.get("surname")?.trim();
    const email = formData.get("email")?.trim();
    const subject = formData.get("subject")?.trim();
    const message = formData.get("message")?.trim();

    const fullName = `${name || ""} ${surname || ""}`.trim();

    /* ===============================
       2️⃣ Basic Validation
    =============================== */

    if (!fullName || !email || !subject || !message) {
      return { error: "All fields are required." };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { error: "Invalid email address." };
    }

    // Length limits
    if (fullName.length > 150) {
      return { error: "Name is too long." };
    }

    if (subject.length > 200) {
      return { error: "Subject is too long." };
    }

    if (message.length > 2000) {
      return { error: "Message is too long." };
    }

    /* ===============================
       3️⃣ Basic Spam Protection
    =============================== */

    // Block too many links
    const links = (message.match(/http/gi) || []).length;
    if (links > 3) {
      return { error: "Too many links in message." };
    }

    /* ===============================
       4️⃣ Rate Limiting (Per IP)
    =============================== */

   /* ===============================
   4️⃣ Rate Limiting (Per IP)
================================ */

const headersList = await headers();

const ip =
  headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "127.0.0.1";

    // Max 5 messages per hour per IP
    const [recent] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM contact_messages
      WHERE ip_address = ?
        AND created_at > NOW() - INTERVAL 1 HOUR
      `,
      [ip]
    );

    if (recent[0].count >= 5) {
      return { error: "Too many messages sent. Please try again later." };
    }

    /* ===============================
       5️⃣ Save to Database
    =============================== */

    await db.query(
      `
      INSERT INTO contact_messages 
      (name, email, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?)
      `,
      [fullName, email, subject, message, ip]
    );

    /* ===============================
       6️⃣ Send Email Notification
    =============================== */

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact: ${subject}`,
      text: `
New message from your website:

Name: ${fullName}
Email: ${email}
IP: ${ip}

Subject: ${subject}

Message:
${message}
      `,
    });

    return { success: true };

  } catch (error) {
    console.error("Contact form error:", error);
    return { error: "Something went wrong. Please try again later." };
  }
}
