/**
 * Centralized Email Utility
 * Uses Nodemailer with SMTP credentials from environment variables.
 * Import and call sendEmail() from any server-side route.
 */

import nodemailer from "nodemailer";

const createTransporter = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    const transporter = createTransporter();
    return transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
    });
}

// ── Email Templates ───────────────────────────────────────────────────────────

export function cdnKeyIssuedEmail(opts: {
    appName: string;
    applicantName: string;
    plan: string;
    rawKey: string;
    keyPrefix: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f7; margin:0; padding:0;">
  <div style="max-width:600px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%); padding:40px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:24px; font-weight:700;">CDN API Key Issued</h1>
      <p style="color:rgba(255,255,255,0.7); margin:8px 0 0; font-size:14px;">Your application has been approved</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#333; font-size:16px;">Hi <strong>${opts.applicantName}</strong>,</p>
      <p style="color:#555; font-size:15px;">
        Your application for <strong>${opts.appName}</strong> has been approved and your API key is ready.
      </p>

      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:20px; margin:24px 0;">
        <p style="margin:0 0 8px; font-size:12px; color:#16a34a; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Your API Key — Copy &amp; Store Safely</p>
        <code style="display:block; font-size:15px; font-family:monospace; color:#0f172a; word-break:break-all; background:#fff; padding:14px 16px; border-radius:8px; border:1px solid #bbf7d0;">
          ${opts.rawKey}
        </code>
        <p style="margin:10px 0 0; font-size:12px; color:#dc2626;">
          ⚠️ This key is shown <strong>once only</strong> and cannot be retrieved again. Store it somewhere safe.
        </p>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0; color:#888; width:40%;">Plan</td>
          <td style="padding:8px 0; color:#333; font-weight:600; text-transform:capitalize;">${opts.plan}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#888;">Key Prefix</td>
          <td style="padding:8px 0; color:#333; font-family:monospace;">${opts.keyPrefix}…</td>
        </tr>
      </table>

      <p style="color:#555; font-size:14px;">Use this key with every request:</p>
      <pre style="background:#1e1e2e; color:#cdd6f4; padding:16px; border-radius:8px; font-size:13px; overflow-x:auto; margin:0 0 24px;">Authorization: Bearer ${opts.rawKey}</pre>

      <p style="color:#888; font-size:13px; line-height:1.6;">
        Read the <a href="https://meetbhingradiya.vercel.app/docs/CDN_EXTERNAL_API.md" style="color:#6366f1;">full API documentation</a> to get started. 
        You can also manage and rotate your key from the 
        <a href="https://meetbhingradiya.vercel.app/settings/cdn" style="color:#6366f1;">CDN settings page</a>.
      </p>
    </div>
    <div style="padding:20px 40px; border-top:1px solid #f0f0f0; text-align:center; color:#aaa; font-size:12px;">
      Meet Bhingradiya · <a href="https://meetbhingradiya.vercel.app" style="color:#aaa;">meetbhingradiya.vercel.app</a>
    </div>
  </div>
</body>
</html>`;
}
