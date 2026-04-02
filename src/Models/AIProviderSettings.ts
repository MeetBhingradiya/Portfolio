/**
 * AIProviderSettings Mongoose Model
 * Singleton configuration for AI providers (GitHub, Google, Perplexity).
 * Admin-managed. Secrets are write-only — never returned to the client.
 */

import mongoose from "mongoose";

// ─── Supported providers & models ────────────────────────────────────────────

export const AI_PROVIDERS = {
    github: {
        label: "GitHub Models (Azure AI)",
        baseUrl: "https://models.inference.ai.azure.com",
        models: [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4.1",
            "gpt-4.1-mini",
            "gpt-4.1-nano",
            "o1",
            "o1-mini",
            "o3",
            "o3-mini",
            "o4-mini",
            "Meta-Llama-3.3-70B-Instruct",
            "Mistral-Large",
            "Phi-4",
        ],
    },
    google: {
        label: "Google Gemini",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        models: [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-2.5-flash-preview-04-17",
            "gemini-2.5-pro-preview-03-25",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
    },
    perplexity: {
        label: "Perplexity AI",
        baseUrl: "https://api.perplexity.ai",
        models: [
            "sonar",
            "sonar-pro",
            "sonar-reasoning",
            "sonar-reasoning-pro",
            "sonar-deep-research",
            "r1-1776",
        ],
    },
} as const;

export type AIProviderKey = keyof typeof AI_PROVIDERS;

// ─── Sub-schema ───────────────────────────────────────────────────────────────

const AIProviderConfigSchema = new mongoose.Schema(
    {
        enabled: { type: Boolean, default: false },
        apiKey: { type: String, default: "" },      // Encrypted at rest, write-only in admin API
        activeModel: { type: String, default: "" },  // Selected model for this provider
        customBaseUrl: { type: String, default: "" }, // Optional override
    },
    { _id: false }
);

// ─── Schema ──────────────────────────────────────────────────────────────────

const AIProviderSettings_Schema = new mongoose.Schema(
    {
        ConfigID: {
            type: String,
            default: "ai_provider_settings_singleton",
            unique: true,
            index: true,
        },
        // Active provider for task AI features
        ActiveProvider: {
            type: String,
            enum: Object.keys(AI_PROVIDERS),
            default: "github",
        },
        // Per-provider configuration
        Providers: {
            github: { type: AIProviderConfigSchema, default: () => ({}) },
            google: { type: AIProviderConfigSchema, default: () => ({}) },
            perplexity: { type: AIProviderConfigSchema, default: () => ({}) },
        },
        // Feature flags for AI capabilities
        Features: {
            taskCreation: { type: Boolean, default: true },
            intelligentSearch: { type: Boolean, default: true },
            habitSuggestion: { type: Boolean, default: true },
            goalBreakdown: { type: Boolean, default: true },
            ocrExtraction: { type: Boolean, default: true },
        },
        // Rate limiting
        RateLimitPerUser: {
            dailyRequests: { type: Number, default: 50 },
            monthlyRequests: { type: Number, default: 500 },
        },
        // Last updated by
        LastUpdatedBy: { type: String, default: "" },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export interface IAIProviderConfig {
    enabled: boolean;
    apiKey: string;
    activeModel: string;
    customBaseUrl: string;
}

export interface IAIProviderSettings extends mongoose.Document {
    ConfigID: string;
    ActiveProvider: AIProviderKey;
    Providers: {
        github: IAIProviderConfig;
        google: IAIProviderConfig;
        perplexity: IAIProviderConfig;
    };
    Features: {
        taskCreation: boolean;
        intelligentSearch: boolean;
        habitSuggestion: boolean;
        goalBreakdown: boolean;
        ocrExtraction: boolean;
    };
    RateLimitPerUser: {
        dailyRequests: number;
        monthlyRequests: number;
    };
    LastUpdatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const AIProviderSettings_Model: mongoose.Model<IAIProviderSettings> =
    mongoose.models.AIProviderSettings ||
    mongoose.model<IAIProviderSettings>("AIProviderSettings", AIProviderSettings_Schema);

/**
 * Get the singleton AI provider settings document.
 * Creates it with defaults if it doesn't exist.
 */
export async function getAIProviderSettings(): Promise<IAIProviderSettings> {
    let doc = await AIProviderSettings_Model.findOne({
        ConfigID: "ai_provider_settings_singleton",
    });
    if (!doc) {
        doc = await AIProviderSettings_Model.create({
            ConfigID: "ai_provider_settings_singleton",
        });
    }
    return doc;
}
