/**
 * Stripe — Create Checkout Session
 *
 * POST /api/payments/stripe/create-session
 *
 * Body:
 *   { priceId: string, mode: "payment" | "subscription", purpose?: string, referenceId?: string }
 *
 * Returns the Stripe Checkout session URL for redirect.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession } from "@/Library/auth";
import dbConnect from "@Utils/dbConnect";
import { Payment } from "@Models/Payment";

export async function POST(req: NextRequest) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2026-02-25.clover",
    });
    try {
        const session = await getSession(req.headers);
        if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

        const { priceId, mode = "payment", purpose = "other", referenceId, metadata } = await req.json();
        if (!priceId) return NextResponse.json({ error: "priceId is required." }, { status: 422 });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meetbhingradiya.vercel.app";

        await dbConnect();

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: mode as "payment" | "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            customer_email: session.user.email,
            success_url: `${appUrl}/settings/cdn?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url : `${appUrl}/settings/cdn?payment=cancelled`,
            metadata   : {
                userId     : session.user.id    || "",
                userEmail  : session.user.email || "",
                purpose,
                referenceId: referenceId || "",
                ...(metadata || {}),
            },
        });

        // Record pending payment
        await Payment.create({
            userId          : session.user.id || session.user.email,
            userEmail       : session.user.email,
            provider        : "stripe",
            type            : mode === "subscription" ? "subscription" : "one_time",
            purpose,
            referenceId,
            amount          : 0,        // filled on webhook
            currency        : "usd",
            stripeSessionId : checkoutSession.id,
            status          : "pending",
        });

        return NextResponse.json({ url: checkoutSession.url, sessionId: checkoutSession.id });
    } catch (err: any) {
        console.error("[Stripe create-session]", err);
        return NextResponse.json({ error: err?.message || "Failed to create session." }, { status: 500 });
    }
}
