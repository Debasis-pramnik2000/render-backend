require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const { Resend } = require("resend");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limit: 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many messages sent. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, async (req, res) => {
  const { name, email, message, website } = req.body;
  // "website" is the honeypot field — see note at bottom of file

  // Honeypot check: real users never fill this field (it's hidden via CSS).
  // A bot filling it in gets silently rejected without revealing why.
  if (website) {
    console.warn("Honeypot triggered — likely bot submission:", { email });
    return res.status(200).json({ success: true, message: "Email Sent Successfully" });
    // Note: we return a fake success (200) instead of an error, so bots
    // don't learn their submission was blocked and keep trying different tactics.
  }

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY environment variable");
    return res.status(500).json({ success: false, message: "Server email configuration is missing" });
  }

  try {
    console.log("Contact request received:", { name, email });

    const { data, error } = await resend.emails.send({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: process.env.NOTIFY_EMAIL,
      replyTo: email,
      subject: "New Portfolio Contact",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message)}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(500).json({
        success: false,
        message:
          process.env.NODE_ENV === "production"
            ? "Failed to send message. Please try again later."
            : error.message,
      });
    }

    console.log("Email sent successfully:", data.id);
    res.status(200).json({ success: true, message: "Email Sent Successfully" });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Failed to send message. Please try again later."
          : error.message,
    });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = router;

/*
FRONTEND SETUP FOR THE HONEYPOT FIELD:

Add a hidden input to your contact form that real users won't see or fill,
but bots (which auto-fill every field) will:

  <input
    type="text"
    name="website"
    style={{ display: "none" }}
    tabIndex={-1}
    autoComplete="off"
  />

Make sure this field's value is included in the JSON body you POST to /contact
alongside name, email, and message.
*/