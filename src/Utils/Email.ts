/**
 * Centralized Email Utility
 * Uses Nodemailer with SMTP credentials from environment variables.
 * Import and call sendEmail() from any server-side route.
 */

import nodemailer from "nodemailer";
import { getPrimaryOrigin } from "./origin";

const createTransporter = () => {
    const port = parseInt((process.env.SMTP_PORT || "587").trim(), 10);
    const secureEnv = (process.env.SMTP_SECURE || "").trim().toLowerCase();
    const secure = secureEnv === "true" || port === 465;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
};

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

import fs from "fs";
import path from "path";

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    try {
        // Quick check for missing config
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn("[Email] ⚠️ SMTP configuration is missing. Email will not be sent.");
            throw new Error("Missing SMTP configuration");
        }

        const transporter = createTransporter();
        return await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
            text
        });
    } catch (error: any) {
        console.error(`[Email] ❌ Failed to send email to ${to}:`, error.message || error);
        
        // Save the HTML locally so the developer can still view/test the email design
        const debugPath = path.join(process.cwd(), "debug-email.html");
        try {
            fs.writeFileSync(debugPath, html, "utf-8");
            console.log(`[Email] 🐛 Saved email HTML to ${debugPath} for local debugging.`);
        } catch (fsErr) {
            // Ignore file write errors
        }

        throw error;
    }
}

function renderEmailShell(opts: {
    preheader: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    accent: string;
    body: string;
    note?: string;
}): string {
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.preheader}</span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:0;background:linear-gradient(140deg,#0f172a 0%,#1e293b 55%,#334155 100%);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:30px 30px 24px 30px;">
                    <div style="display:inline-block;padding:6px 11px;border-radius:999px;background:rgba(255,255,255,0.14);color:#f8fafc;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;">${opts.eyebrow}</div>
                    <h1 style="margin:14px 0 8px 0;color:#ffffff;font-size:30px;line-height:1.2;font-weight:800;">${opts.title}</h1>
                    <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.55;">${opts.subtitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;">
              ${opts.body}
            </td>
          </tr>

          ${opts.note
            ? `<tr><td style="padding:0 30px 24px 30px;"><div style="border-radius:12px;background:${opts.accent}14;border:1px solid ${opts.accent}38;padding:12px 14px;color:#334155;font-size:12px;line-height:1.55;">${opts.note}</div></td></tr>`
            : ""
        }

          <tr>
            <td style="padding:18px 30px;border-top:1px solid #e5e7eb;background:#fafafa;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
              Meet Bhingradiya Portfolio • ${year}<br/>
              <a href="https://www.meetbhingradiya.in" style="color:#64748b;text-decoration:none;">www.meetbhingradiya.in</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getPublicBaseUrl(): string {
    const raw = getPrimaryOrigin()
    const normalized = (raw || "https://www.meetbhingradiya.in").trim();
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
        return normalized.replace(/\/$/, "");
    }
    return `https://${normalized.replace(/\/$/, "")}`;
}

function toAbsoluteAssetUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    const base = getPublicBaseUrl();
    const cleaned = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleaned}`;
}

export function VerificationEmailforChangeEmail(opts: {
    name?: string;
    verificationUrl: string;
    expiresInMinutes: number;
    verificationImageUrl?: string;
}): string {
    const accent = "#2563eb";
    const verificationImageUrl = toAbsoluteAssetUrl(opts.verificationImageUrl || "/assets/EmailConfirm.svg");

    return renderEmailShell({
        preheader: "Confirm your new email to update your account.",
        eyebrow: "Email Change Request",
        title: "Verify Your New Email",
        subtitle: "Confirming your new email keeps your account secure and up-to-date.",
        accent,
        body: `
            <div style="margin:0 0 20px 0;text-align:center;">
                <img src="${verificationImageUrl}" alt="Email verification illustration" width="220" style="max-width:100%;height:auto;display:inline-block;" />
            </div>
            <p style="margin:0 0 16px 0;color:#1e293b;font-size:15px;line-height:1.75;">
                Hi <strong>${opts.name || "there"}</strong>,<br/>
                We received a request to change the email address on your account. Please verify your new email to confirm this change.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
                <tr>
                    <td align="center" style="border-radius:12px;background:${accent};">
                        <a href="${opts.verificationUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                            Verify New Email Address    
                        </a>
                    </td>
                </tr>
            </table>
            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
                This secure link expires in <strong>${opts.expiresInMinutes} minutes</strong>. If you did not request this change, please ignore this email and consider resetting your password for security.
            </p>
        `,
        note: "For your safety, email change verification links are single-use and time-limited."
    });
}


export function verificationEmailTemplate(opts: {
    name?: string;
    verificationUrl: string;
    expiresInMinutes: number;
    verificationImageUrl?: string;
}): string {
    const accent = "#2563eb";
    const verificationImageUrl = toAbsoluteAssetUrl(opts.verificationImageUrl || "/assets/EmailConfirm.svg");

    return renderEmailShell({
        preheader: "Confirm your email to activate your account.",
        eyebrow: "Account Security",
        title: "Verify Your Email",
        subtitle: "One quick confirmation keeps your account secure and unlocks full access.",
        accent,
        body: `
          <div style="margin:0 0 20px 0;text-align:center;">
            <img src="${verificationImageUrl}" alt="Email verification illustration" width="220" style="max-width:100%;height:auto;display:inline-block;" />
          </div>

          <p style="margin:0 0 16px 0;color:#1e293b;font-size:15px;line-height:1.75;">
            Hi <strong>${opts.name || "there"}</strong>,<br/>
            Thanks for joining. Please verify your email address to continue using your account.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.verificationUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
            This secure link expires in <strong>${opts.expiresInMinutes} minutes</strong>. If this was not you, you can safely ignore this email.
          </p>
        `,
        note: "For your safety, email verification links are single-use and time-limited."
    });
}

export function passwordResetEmail(opts: {
    name?: string;
    resetUrl: string;
    expiresInMinutes: number;
}): string {
    const accent = "#7c3aed";

    return renderEmailShell({
        preheader: "Reset your password using the secure link below.",
        eyebrow: "Password Reset",
        title: "Reset Your Password",
        subtitle: "A secure reset link is ready. Use it to choose a new password for your account.",
        accent,
        body: `
          <p style="margin:0 0 16px 0;color:#1e293b;font-size:15px;line-height:1.75;">
            Hi <strong>${opts.name || "there"}</strong>,<br/>
            We received a request to reset the password on your account. Click the button below to continue.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.resetUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
            This secure link expires in <strong>${opts.expiresInMinutes} minutes</strong>. If you did not request a reset, you can ignore this email.
          </p>
        `,
        note: "For your safety, password reset links are single-use and time-limited."
    });
}

export function deleteAccountVerificationEmail(opts: { name?: string; verificationUrl: string; expiresInHours: number }): string {
    const accent = "#b91c1c";

    return renderEmailShell({
        preheader: "Final confirmation required to delete your account.",
        eyebrow: "Critical Action",
        title: "Confirm Account Deletion",
        subtitle: "This request is sensitive and requires explicit confirmation.",
        accent,
        body: `
          <p style="margin:0 0 14px 0;color:#1e293b;font-size:15px;line-height:1.75;">
            Hi <strong>${opts.name || "there"}</strong>,<br/>
            We received a request to permanently delete your account and associated data.
          </p>

          <div style="margin:0 0 16px 0;padding:12px 14px;border-radius:12px;background:#fff1f2;border:1px solid #fecdd3;color:#9f1239;font-size:13px;line-height:1.65;">
            This action is irreversible. After confirmation, recovery will not be possible.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.verificationUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  Confirm Permanent Deletion
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
            This confirmation link expires in <strong>${opts.expiresInHours} hours</strong>. If you did not request this, ignore this message.
          </p>
        `,
        note: "Security recommendation: if this request was not initiated by you, reset your password immediately."
    });
}

export function loginNotificationEmail(opts: {
    name?: string;
    ipAddress: string;
    location: string;
    platform: string;
    deviceType: string;
    browser: string;
    loginAt: string;
    eventPath?: string;
}): string {
    const loginTime = new Date(opts.loginAt).toLocaleString();
    const accent = "#0f766e";

    return renderEmailShell({
        preheader: "A new sign-in was detected on your account.",
        eyebrow: "Security Alert",
        title: "New Login Detected",
        subtitle: "We noticed a successful sign-in. Review details below.",
        accent,
        body: `
          <p style="margin:0 0 16px 0;color:#1e293b;font-size:15px;line-height:1.75;">
            Hi <strong>${opts.name || "there"}</strong>,<br/>
            A new session was created on your account.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;background:#f8fafc;">
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;">Device</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;">${opts.deviceType}</td></tr>
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Platform</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${opts.platform}</td></tr>
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Browser</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${opts.browser}</td></tr>
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Location</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${opts.location}</td></tr>
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">IP Address</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${opts.ipAddress}</td></tr>
            <tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Time</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${loginTime}</td></tr>
            ${opts.eventPath ? `<tr><td style="padding:11px 14px;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Event</td><td style="padding:11px 14px;color:#0f172a;font-size:13px;font-weight:700;text-align:right;border-top:1px solid #e2e8f0;">${opts.eventPath}</td></tr>` : ""}
          </table>

          <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;">
            If this wasn’t you, reset your password and revoke unknown sessions immediately.
          </p>
        `,
        note: "Security tip: enable two-factor authentication to protect future logins."
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

export function supportTicketCreatedEmail(opts: {
    name: string;
    ticketId: string;
    lookupUrl: string;
    isGuest: boolean;
    secretCode?: string;
}): string {
    const accent = "#2563eb";
    let body = `<p style="margin:0 0 16px 0;color:#1e293b;font-size:15px;line-height:1.75;">
            Hi <strong>${opts.name || "there"}</strong>,<br/>
            Your support ticket <strong>${opts.ticketId}</strong> has been successfully created. We are reviewing your request and will get back to you shortly.
          </p>`;

    if (opts.isGuest && opts.secretCode) {
        body += `
          <div style="background:#f1f5f9; border-radius:12px; padding:16px; margin:20px 0; text-align:center; border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px 0; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:.05em;">Your Secret Code</p>
            <code style="display:inline-block; font-size:24px; font-weight:800; color:#0f172a; background:#ffffff; padding:8px 16px; border-radius:8px; border:1px solid #cbd5e1; letter-spacing:.1em;">
              ${opts.secretCode}
            </code>
            <p style="margin:12px 0 0; font-size:12px; color:#ef4444;">
              ⚠️ Keep this code safe. You will need it to view your ticket.
            </p>
          </div>`;
    }

    body += `
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.lookupUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  Track Your Ticket
                </a>
              </td>
            </tr>
          </table>
    `;

    return renderEmailShell({
        preheader: "Your support ticket has been created.",
        eyebrow: "Support Ticket",
        title: "Ticket Received",
        subtitle: "We have received your inquiry and are on it.",
        accent,
        body,
        note: opts.isGuest ? "To check updates securely, you will need the secret code provided above." : ""
    });
}

export function supportTicketReplyCustomerEmail(opts: {
    ticketId: string;
    ticketUrl: string;
    replyBody: string;
}): string {
    const accent = "#2563eb";
    return renderEmailShell({
        preheader: "Support has replied to your ticket.",
        eyebrow: "Support Update",
        title: "New Reply on Your Ticket",
        subtitle: `Ticket ${opts.ticketId} has a new update from our team.`,
        accent,
        body: `
          <div style="margin:20px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#64748b;">Message Content</p>
            <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;word-break:break-word;">${opts.replyBody}</div>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.ticketUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  View Your Ticket
                </a>
              </td>
            </tr>
          </table>
        `,
    });
}

export function supportTicketReplyAdminEmail(opts: {
    ticketId: string;
    ticketUrl: string;
    replyBody: string;
    replierName: string;
}): string {
    const accent = "#f59e0b";
    return renderEmailShell({
        preheader: "A customer replied to a support ticket.",
        eyebrow: "Admin Notification",
        title: "New Customer Reply",
        subtitle: `${opts.replierName} replied to Ticket ${opts.ticketId}.`,
        accent,
        body: `
          <div style="margin:20px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#64748b;">Message Content</p>
            <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;word-break:break-word;">${opts.replyBody}</div>
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 18px 0;">
            <tr>
              <td align="center" style="border-radius:12px;background:${accent};">
                <a href="${opts.ticketUrl}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:.01em;">
                  View Admin Dashboard
                </a>
              </td>
            </tr>
          </table>
        `,
    });
}

export function contactUserAcknowledgmentEmail(opts: { name: string; subject: string }): string {
    const accent = "#10b981";
    return renderEmailShell({
        preheader: "We received your message.",
        eyebrow: "Message Received",
        title: "Thank you for getting in touch!",
        subtitle: "Your message has been received and I will review it shortly.",
        accent,
        body: `
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
            Hi <strong>${opts.name}</strong>,
          </p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#475569;">
            Thank you for reaching out regarding <strong>"${opts.subject}"</strong>. Your message has been received and I will get back to you as soon as possible.
          </p>
          <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#64748b;">
            If your inquiry is urgent, you may also connect with me directly through LinkedIn or GitHub.
          </p>
        `,
    });
}

export function contactAdminNotificationEmail(opts: {
    name: string;
    email: string;
    subject: string;
    message: string;
    ip: string;
    date: Date;
}): string {
    const accent = "#6366f1";
    return renderEmailShell({
        preheader: "New contact message from your portfolio.",
        eyebrow: "New Contact Message",
        title: "You have a new message",
        subtitle: "Someone reached out via your contact form.",
        accent,
        body: `
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px 0;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;width:120px;">Name:</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${opts.name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Email:</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${opts.email}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Subject:</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${opts.subject}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">IP:</td><td style="padding:8px 0;color:#0f172a;font-family:monospace;">${opts.ip}</td></tr>
          </table>
          <div style="margin:20px 0;padding:16px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#64748b;">Message Content</p>
            <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;word-break:break-word;">${opts.message}</div>
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="mailto:${opts.email}?subject=Re: ${encodeURIComponent(opts.subject)}" style="display:inline-block;padding:12px 24px;background:${accent};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
              Reply directly via Email
            </a>
          </div>
        `
    });
}
