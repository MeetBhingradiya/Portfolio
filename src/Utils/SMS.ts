/**
 * SMS Utility (Twilio)
 * Centralized sender for OTP and security notifications.
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function getTwilioConfig() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    return {
        accountSid,
        authToken,
        fromNumber,
        messagingServiceSid
    };
}

export async function sendPhoneOtpSms(phoneNumber: string, code: string): Promise<void> {
    const cfg = getTwilioConfig();

    if (!cfg.accountSid || !cfg.authToken || (!cfg.fromNumber && !cfg.messagingServiceSid)) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Phone OTP provider is not configured (Twilio env vars missing).");
        }
        console.warn(`[SMS] Phone OTP (dev fallback) for ${phoneNumber}: ${code}`);
        return;
    }

    const body = new URLSearchParams({
        To: phoneNumber,
        Body: `Your Meet Bhingradiya verification code is ${code}. It expires in 5 minutes.`
    });

    if (cfg.messagingServiceSid) {
        body.set("MessagingServiceSid", cfg.messagingServiceSid);
    } else if (cfg.fromNumber) {
        body.set("From", cfg.fromNumber);
    }

    const response = await fetch(`${TWILIO_API_BASE}/Accounts/${cfg.accountSid}/Messages.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString("base64")}`
        },
        body: body.toString()
    });

    if (!response.ok) {
        const raw = await response.text().catch(() => "");
        throw new Error(`Twilio send failed (${response.status}): ${raw || "No response body"}`);
    }
}
