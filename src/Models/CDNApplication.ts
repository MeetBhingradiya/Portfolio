/**
 * CDN Application Model
 *
 * External developers/users submit an application to request access to the
 * private CDN system. An admin must approve the application before an API key
 * can be issued.
 *
 * Status lifecycle:
 *   pending → approved → (api key issued separately via CDNAPIKey)
 *   pending → rejected
 *   approved → suspended (admin can suspend after approval)
 */
import mongoose, { Schema, Document } from "mongoose";

export type ApplicationStatus = "pending" | "approved" | "rejected" | "suspended";
export type ApplicationPlan = "free" | "basic" | "pro" | "enterprise";

export interface ICDNApplication extends Document {
    // Applicant identity
    applicantName: string; // Full name of the person applying
    applicantEmail: string; // Contact email
    applicantUserId?: string; // If authenticated via your site, their user ID

    // Application details
    appName: string; // Name of the external application
    appDescription: string; // What the app does and why it needs CDN access
    appWebsite?: string; // App website / landing page URL
    appGithub?: string; // GitHub repo URL (optional)
    appOrganisation?: string; // Company or org name (optional)

    // Requested plan & limits
    requestedPlan: ApplicationPlan;
    expectedMonthlyRequests?: number; // Estimated monthly API call volume
    useCaseDetails: string; // Detailed explanation of intended CDN usage

    // Review
    status: ApplicationStatus;
    adminNotes?: string; // Internal note left by reviewer
    reviewedBy?: string; // Admin email or user ID who reviewed
    reviewedAt?: Date;
    rejectionReason?: string; // Shown to applicant on rejection

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const CDNApplicationSchema = new Schema<ICDNApplication>(
    {
        applicantName: { type: String, required: true, trim: true },
        applicantEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        applicantUserId: {
            type: String,
            trim: true,
            sparse: true,
            index: true
        },

        appName: { type: String, required: true, trim: true },
        appDescription: { type: String, required: true, trim: true },
        appWebsite: { type: String, trim: true },
        appGithub: { type: String, trim: true },
        appOrganisation: { type: String, trim: true },

        requestedPlan: {
            type: String,
            enum: ["free", "basic", "pro", "enterprise"],
            default: "free"
        },
        expectedMonthlyRequests: { type: Number, min: 0 },
        useCaseDetails: { type: String, required: true, trim: true },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "suspended"],
            default: "pending",
            index: true
        },
        adminNotes: { type: String, trim: true },
        reviewedBy: { type: String, trim: true },
        reviewedAt: { type: Date },
        rejectionReason: { type: String, trim: true }
    },
    { timestamps: true }
);

CDNApplicationSchema.index({ status: 1, createdAt: -1 });

export const CDNApplication = mongoose.models.CDNApplication || mongoose.model<ICDNApplication>("CDNApplication", CDNApplicationSchema);
