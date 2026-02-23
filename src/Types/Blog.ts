/**
 * Blog shared types — safe to import in both client and server components.
 * Does NOT import mongoose.
 */

export enum BlogStatus {
    Draft = "draft",
    PendingReview = "pending_review",
    Published = "published",
    Unlisted = "unlisted",
    Private = "private",
    Rejected = "rejected"
}

export enum BlogVisibility {
    Public = "public",
    Private = "private",
    Draft = "draft",
    Scheduled = "scheduled"
}

export enum BlogCategory {
    Technology = "technology",
    Development = "development",
    Design = "design",
    Career = "career",
    Tutorial = "tutorial",
    News = "news",
    Personal = "personal",
    Other = "other"
}
