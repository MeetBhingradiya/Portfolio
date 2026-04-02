/**
 * POST /api/productivity/ai
 * AI-powered productivity features:
 *   - action=create_task    : Generate task from natural language
 *   - action=create_habit   : Suggest habit from description
 *   - action=create_goal    : Break down goal into milestones
 *   - action=search         : Intelligent search with AI re-ranking
 *   - action=ocr            : (handled client-side via Tesseract.js)
 *   - action=suggest_habits : Get habit suggestions for a goal
 */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import dbConnect from "@Utils/dbConnect";
import { getResolvedUser } from "@Utils/RolePermissions";
import { getAIProviderSettings, AI_PROVIDERS, type AIProviderKey } from "@Models/AIProviderSettings";
import { UserProductivityStats } from "@Models/UserProductivityStats";
import { decryptStoredSecret } from "@Utils/SecretVault";

// ─── Provider call helper ─────────────────────────────────────────────────────

async function callAI(
    provider: AIProviderKey,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userMessage: string,
    customBaseUrl?: string
): Promise<string> {
    const providerConfig = AI_PROVIDERS[provider];
    const baseUrl = customBaseUrl?.trim() || providerConfig.baseUrl;

    if (provider === "google") {
        // Google Gemini uses a different API shape
        const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                    }
                ],
                generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Google AI error ${res.status}: ${err}`);
        }

        const data = (await res.json()) as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> };
            }>;
        };
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    // OpenAI-compatible (GitHub Models / Perplexity)
    const url = `${baseUrl}/chat/completions`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_tokens: 2048,
            temperature: 0.7
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`AI provider error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? "";
}

// ─── System prompts ───────────────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
    create_task: `You are a productivity assistant. Given a natural language description, create a structured task in JSON.
Return ONLY valid JSON matching this schema:
{
  "Title": string,          // concise task title (max 100 chars)
  "Description": string,    // detailed description (optional)
  "Priority": "LOW"|"MEDIUM"|"HIGH"|"URGENT",
  "Category": "PERSONAL"|"WORK"|"HEALTH"|"EDUCATION"|"FINANCE"|"SOCIAL"|"HOBBY"|"OTHER",
  "Tags": string[],         // 1-5 relevant tags
  "DueDate": string|null,   // ISO date if mentioned, else null
  "SubTasks": [{"text": string}]  // up to 5 sub-tasks if applicable
}`,

    create_habit: `You are a habit coach. Given a description, create a structured habit in JSON.
Return ONLY valid JSON matching this schema:
{
  "Title": string,
  "Description": string,
  "Category": "HEALTH"|"FITNESS"|"MINDFULNESS"|"LEARNING"|"PRODUCTIVITY"|"SOCIAL"|"FINANCE"|"CREATIVITY"|"OTHER",
  "Difficulty": "EASY"|"MEDIUM"|"HARD",
  "Emoji": string,          // single emoji
  "Frequency": "DAILY"|"WEEKLY"|"MONTHLY",
  "FrequencyDays": number[], // 0=Sun...6=Sat
  "TargetValue": number|null,
  "TargetUnit": string|null,
  "ReminderEnabled": boolean,
  "ReminderTime": string|null // "HH:MM" format
}`,

    create_goal: `You are a goal-setting coach. Given a description, create a structured goal with milestones in JSON.
Return ONLY valid JSON matching this schema:
{
  "Title": string,
  "Description": string,
  "Category": "CAREER"|"EDUCATION"|"HEALTH"|"FITNESS"|"FINANCE"|"RELATIONSHIPS"|"PERSONAL_GROWTH"|"CREATIVITY"|"TRAVEL"|"TECHNOLOGY"|"OTHER",
  "Type": "SHORT_TERM"|"LONG_TERM"|"ONGOING",
  "Emoji": string,
  "ProgressType": "PERCENTAGE"|"NUMERIC"|"BOOLEAN",
  "ProgressTarget": number,
  "ProgressUnit": string|null,
  "Motivation": string,
  "Tags": string[],
  "TargetDate": string|null, // ISO date
  "Milestones": [
    {"Title": string, "Description": string, "TargetDate": string|null, "XPReward": number}
  ]
}`,

    suggest_habits: `You are a habit coach. Given a goal description, suggest 3-5 supporting habits in JSON array.
Return ONLY a valid JSON array of habit objects with fields: Title, Category, Difficulty, Emoji, Frequency.`,

    search: `You are a productivity search assistant. Given a list of items and a search query, 
return the IDs of the most relevant items in order of relevance as a JSON array of strings.
Be lenient with typos and synonyms. Focus on semantic meaning.`
};

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const h = await headers();
        const user = await getResolvedUser(h);
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { action, prompt, items } = body as {
            action: keyof typeof SYSTEM_PROMPTS;
            prompt: string;
            items?: Array<{ id: string; text: string }>;
        };

        if (!action || !prompt?.trim()) {
            return NextResponse.json({ success: false, error: "action and prompt are required" }, { status: 400 });
        }

        const settings = await getAIProviderSettings();

        const providerKeys = Object.keys(settings.Providers) as AIProviderKey[];
        const resolvedApiKeys = Object.fromEntries(
            providerKeys.map((k) => {
                try {
                    return [k, decryptStoredSecret(settings.Providers[k].apiKey || "")];
                } catch {
                    return [k, ""];
                }
            })
        ) as Record<AIProviderKey, string>;

        // Find the active enabled provider
        const activeProvider = settings.ActiveProvider;
        const providerConfig = settings.Providers[activeProvider];
        const activeApiKey = resolvedApiKeys[activeProvider];

        if (!providerConfig.enabled || !activeApiKey) {
            // Try to find any enabled provider as fallback
            const fallback = providerKeys.find((k) => settings.Providers[k].enabled && resolvedApiKeys[k]);
            if (!fallback) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "No AI provider is configured. Please configure one in the admin panel."
                    },
                    { status: 503 }
                );
            }
        }

        const provider =
            providerConfig.enabled && activeApiKey
                ? activeProvider
                : providerKeys.find((k) => settings.Providers[k].enabled && resolvedApiKeys[k])!;

        const config = settings.Providers[provider];
        const apiKey = resolvedApiKeys[provider];
        const model = config.activeModel || AI_PROVIDERS[provider].models[0];

        // Build user message
        let userMessage = prompt;
        if (action === "search" && items) {
            userMessage = `Query: "${prompt}"\n\nItems:\n${items.map((item) => `- ID: ${item.id} | Text: ${item.text}`).join("\n")}`;
        }

        const rawResponse = await callAI(
            provider,
            apiKey,
            model,
            SYSTEM_PROMPTS[action] ?? SYSTEM_PROMPTS.create_task,
            userMessage,
            config.customBaseUrl
        );

        // Parse JSON from response
        let parsed: unknown;
        try {
            const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ?? rawResponse.match(/```\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : rawResponse.trim();
            parsed = JSON.parse(jsonStr);
        } catch {
            // Return raw if not JSON (e.g. for search)
            parsed = rawResponse;
        }

        // Track AI usage
        await UserProductivityStats.updateOne(
            { UserID: user.userId },
            {
                $inc: {
                    AISearchesPerformed: action === "search" ? 1 : 0,
                    AITasksCreated: action === "create_task" ? 1 : 0
                }
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            data: parsed,
            provider,
            model
        });
    } catch (err) {
        console.error("POST /api/productivity/ai:", err);
        const message = err instanceof Error ? err.message : "AI request failed";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
