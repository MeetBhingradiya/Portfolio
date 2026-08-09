/**
 * POST /api/contact - Submit contact inquiry with MongoDB rate limiting & notification
 * GET  /api/contact - Admin/Employee query contact submissions
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { ContactMessage } from "@Models/ContactMessage";
import { sendEmail } from "@Utils/Email";
import { getResolvedUser, hasPermission } from "@Utils/RolePermissions";

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        "127.0.0.1"
    );
}

function buildAdminNotificationHtml(data: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    services?: string[];
    ip: string;
    date: Date;
}) {
    const year = new Date().getFullYear();
    const servicesList = data.services && data.services.length > 0 ? data.services.join(", ") : "None specified";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);">
              <span style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#dbeafe;">New Inquiry</span>
              <h1 style="margin:6px 0 0 0;font-size:24px;font-weight:800;color:#ffffff;">📬 New Contact Form Submission</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;color:#e2e8f0;">
                <tr>
                  <td style="padding:8px 0;width:120px;font-weight:600;color:#94a3b8;">Sender Name:</td>
                  <td style="padding:8px 0;font-weight:600;color:#ffffff;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Email Address:</td>
                  <td style="padding:8px 0;"><a href="mailto:${data.email}" style="color:#60a5fa;text-decoration:none;">${data.email}</a></td>
                </tr>
                ${data.phone ? `
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Phone Number:</td>
                  <td style="padding:8px 0;color:#ffffff;">${data.phone}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Subject:</td>
                  <td style="padding:8px 0;font-weight:600;color:#ffffff;">${data.subject}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Services:</td>
                  <td style="padding:8px 0;color:#cbd5e1;">${servicesList}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Sender IP:</td>
                  <td style="padding:8px 0;color:#cbd5e1;font-family:monospace;">${data.ip}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:600;color:#94a3b8;">Submitted At:</td>
                  <td style="padding:8px 0;color:#cbd5e1;">${data.date.toUTCString()}</td>
                </tr>
              </table>

              <div style="margin-top:20px;padding:16px 20px;background:#0f172a;border-radius:12px;border:1px solid #334155;">
                <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#94a3b8;">Message Content</p>
                <div style="font-size:14px;line-height:1.7;color:#f1f5f9;white-space:pre-wrap;word-break:break-word;">${data.message}</div>
              </div>

              <div style="margin-top:24px;text-align:center;">
                <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Reply directly via Email</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#0f172a;border-top:1px solid #334155;text-align:center;font-size:12px;color:#64748b;">
              Meet Bhingradiya Portfolio Notification • ${year}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildUserAcknowledgmentHtml(data: { name: string; subject: string }) {
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#059669 0%,#047857 100%);">
              <span style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#d1fae5;">Message Received</span>
              <h1 style="margin:6px 0 0 0;font-size:24px;font-weight:800;color:#ffffff;">Thank you for getting in touch!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e2e8f0;">
                Hi <strong>${data.name}</strong>,
              </p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#cbd5e1;">
                Thank you for reaching out regarding <strong>"${data.subject}"</strong>. Your message has been received and I will review it and get back to you as soon as possible.
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#94a3b8;">
                If your inquiry is urgent, you may also connect with me directly through LinkedIn or GitHub.
              </p>
              <div style="border-top:1px solid #334155;padding-top:16px;font-size:14px;color:#cbd5e1;">
                Best regards,<br/>
                <strong style="color:#ffffff;">Meet Bhingradiya</strong>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#0f172a;border-top:1px solid #334155;text-align:center;font-size:12px;color:#64748b;">
              Meet Bhingradiya • <a href="https://www.meetbhingradiya.in" style="color:#60a5fa;text-decoration:none;">www.meetbhingradiya.in</a> • ${year}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const clientIp = getClientIp(req);
        const userAgent = req.headers.get("user-agent") || "";
        const body = await req.json();

        // 1. Honeypot check for bots
        if (body.botField || body.website || body.fax) {
            // Silently return success to avoid bot retries
            return NextResponse.json({
                success: true,
                message: "Thank you! Your message has been received."
            });
        }

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const subject = String(body.subject || "").trim();
        const message = String(body.message || "").trim();
        const phone = body.phone ? String(body.phone).trim() : undefined;
        const services = Array.isArray(body.services)
            ? body.services.map((s: any) => String(s).trim()).filter(Boolean)
            : undefined;

        // 2. Validation
        if (!name || name.length < 2 || name.length > 100) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid name (2-100 characters)." },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email) || email.length > 200) {
            return NextResponse.json(
                { success: false, error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        if (!subject || subject.length < 2 || subject.length > 300) {
            return NextResponse.json(
                { success: false, error: "Subject must be between 2 and 300 characters." },
                { status: 400 }
            );
        }

        if (!message || message.length < 5 || message.length > 5000) {
            return NextResponse.json(
                { success: false, error: "Message must be between 5 and 5000 characters." },
                { status: 400 }
            );
        }

        // 3. Persist submission in MongoDB
        const contactDoc = await ContactMessage.create({
            name,
            email,
            subject,
            message,
            phone,
            services,
            ip: clientIp,
            userAgent,
            status: "new",
            isRead: false
        });

        // 6. Send Emails
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "meetbhingradiya199@gmail.com";

        // Admin notification email
        try {
            await sendEmail({
                to: adminEmail,
                subject: `📬 Contact Inquiry: ${subject} (from ${name})`,
                html: buildAdminNotificationHtml({
                    name,
                    email,
                    phone,
                    subject,
                    message,
                    services,
                    ip: clientIp,
                    date: contactDoc.createdAt || new Date()
                }),
                text: `New contact submission from ${name} (${email}):\n\nSubject: ${subject}\nPhone: ${phone || "N/A"}\nServices: ${services?.join(", ") || "None"}\nIP: ${clientIp}\n\nMessage:\n${message}`
            });
        } catch (emailErr: any) {
            console.error("[Contact API] Failed to send admin notification email:", emailErr?.message || emailErr);
            // Non-fatal: submission is safely stored in MongoDB
        }

        // User confirmation email
        try {
            await sendEmail({
                to: email,
                subject: `Thank you for contacting Meet Bhingradiya - We received your message`,
                html: buildUserAcknowledgmentHtml({
                    name,
                    subject
                }),
                text: `Hi ${name},\n\nThank you for reaching out regarding "${subject}". Your message has been received and I will get back to you shortly.\n\nBest regards,\nMeet Bhingradiya\nhttps://www.meetbhingradiya.in`
            });
        } catch (emailErr: any) {
            console.error("[Contact API] Failed to send user acknowledgment email:", emailErr?.message || emailErr);
            // Non-fatal
        }

        return NextResponse.json({
            success: true,
            message: "Thank you for reaching out! Your message has been sent successfully.",
            data: {
                id: contactDoc._id,
                name: contactDoc.name,
                email: contactDoc.email,
                subject: contactDoc.subject,
                createdAt: contactDoc.createdAt
            }
        });
    } catch (err: any) {
        console.error("[Contact API Error]:", err);
        return NextResponse.json(
            { success: false, error: err.message || "An unexpected error occurred while sending your message." },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const canView = user.isAdmin || user.isEmployee || (await hasPermission(h, "contact.messages.view"));
        if (!canView) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const status = searchParams.get("status");
        const search = searchParams.get("search")?.trim();

        const query: any = { isDeleted: false };
        if (status && ["new", "read", "replied", "archived", "spam"].includes(status)) {
            query.status = status;
        }

        if (search) {
            const regex = new RegExp(search, "i");
            query.$or = [{ name: regex }, { email: regex }, { subject: regex }, { message: regex }];
        }

        const [messages, total] = await Promise.all([
            ContactMessage.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            ContactMessage.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
