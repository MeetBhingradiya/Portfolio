/**
 * AI Resume Pipeline
 *
 * Takes portfolio data (projects, experience, education, certificates,
 * skills, test scores) + a raw job description, feeds it to the configured
 * AI provider, and returns token-optimized JSON with tailored resume data.
 *
 * Token-Optimized Output Keys:
 *   n   = name             t   = title/role        su  = summary
 *   e   = experience[]     s   = education[]       p   = projects[]
 *   c   = certificates[]   sk  = skills[]          ts  = test scores[]
 *   so  = section order[]  rs  = relevance score    po  = project order
 *   r   = responsibilities a   = achievements       d   = description
 *   rel = relevance (0-100 per item)
 *
 * Architecture:
 *   Resume Data + JD → System Prompt + User Prompt → AI SDK → JSON Response
 */

import { getAIProviderSettings, AI_PROVIDERS, type AIProviderKey } from "@Models/AIProviderSettings";
import { decryptStoredSecret } from "@Utils/SecretVault";
import dbConnect from "@Utils/dbConnect";
import OpenAI from "openai";
import {
    Project_Model,
    Skill_Model,
    Education_Model,
    Experience_Model,
    Certificate_Model,
    TestScore_Model
} from "@Models/Portfolio";

// ── Types ────────────────────────────────────────────────────────────────────

/** Compressed resume output from AI — short keys for fewer tokens */
export interface CompressedResumeOutput {
    /** name */
    n: string;
    /** title / role */
    t: string;
    /** summary (tailored to JD) */
    su: string;
    /** section order — recommended order of sections */
    so: string[];
    /** overall relevance score 0-100 */
    rs: number;
    /** experience — ordered by relevance */
    e: CompressedExperience[];
    /** education — ordered by relevance */
    s: CompressedEducation[];
    /** projects — ordered by relevance */
    p: CompressedProject[];
    /** project order — array of ProjectIDs in recommended display order */
    po: string[];
    /** certificates — ordered by relevance */
    c: CompressedCertificate[];
    /** skills — grouped and ordered */
    sk: CompressedSkill[];
    /** test scores — ordered by relevance */
    ts: CompressedTestScore[];
}

export interface CompressedExperience {
    /** ExperienceID */
    id: string;
    /** role */
    t: string;
    /** company */
    co: string;
    /** description — rewritten for JD */
    d: string;
    /** responsibilities — rewritten for JD */
    r: string[];
    /** achievements — rewritten for JD */
    a: string[];
    /** relevance 0-100 */
    rel: number;
}

export interface CompressedEducation {
    /** EducationID */
    id: string;
    /** degree */
    deg: string;
    /** institution */
    inst: string;
    /** field of study */
    f: string;
    /** relevance 0-100 */
    rel: number;
}

export interface CompressedProject {
    /** ProjectID */
    id: string;
    /** title */
    t: string;
    /** description — rewritten for JD */
    d: string;
    /** tech stack — filtered to relevant */
    ts: string[];
    /** relevance 0-100 */
    rel: number;
}

export interface CompressedCertificate {
    /** CertificateID */
    id: string;
    /** title */
    t: string;
    /** issuing org */
    org: string;
    /** relevance 0-100 */
    rel: number;
}

export interface CompressedSkill {
    /** SkillID */
    id: string;
    /** name */
    n: string;
    /** category */
    cat: string;
    /** relevance 0-100 */
    rel: number;
}

export interface CompressedTestScore {
    /** TestScoreID */
    id: string;
    /** exam name */
    n: string;
    /** score */
    sc: string;
    /** relevance 0-100 */
    rel: number;
}

// ── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Resume Optimization AI. Your task is to analyze a job description and reorganize/rewrite resume data to maximize relevance.

RULES:
1. Respond ONLY with valid JSON — no markdown, no backticks, no explanations, no wrapper text.
2. Use SHORT KEYS to minimize tokens. Key map:
   n=name, t=title, su=summary, so=sectionOrder, rs=relevanceScore,
   e=experience, s=education, p=projects, po=projectOrder,
   c=certificates, sk=skills, ts=testScores,
   id=itemID, d=description, r=responsibilities, a=achievements,
   rel=relevance(0-100), co=company, deg=degree, inst=institution,
   f=fieldOfStudy, org=organization, cat=category, sc=score
3. For each item, assign a "rel" score (0-100) indicating relevance to the job.
4. Order items within each category by relevance (highest first).
5. Set "so" (section order) to recommend which sections appear first based on the JD.
   Valid section keys: "e","s","p","c","sk","ts"
6. Set "po" to an array of ProjectIDs ordered by relevance to the JD.
7. Rewrite "su" (summary) to be tailored for the job.
8. Rewrite experience descriptions/responsibilities/achievements to emphasize JD-relevant skills.
9. Rewrite project descriptions to highlight JD-relevant technologies.
10. Filter skills to only include those relevant to the JD (rel > 20).
11. Keep it ATS-friendly — use keywords from the JD naturally.
12. Do NOT invent information. Only reorganize and rewrite what's provided.
13. Keep each description/responsibility/achievement under 2 sentences for brevity.`;

// ── Portfolio Data Loader ────────────────────────────────────────────────────

interface RawPortfolioData {
    projects: any[];
    skills: any[];
    education: any[];
    experience: any[];
    certificates: any[];
    testScores: any[];
}

export async function loadPortfolioData(): Promise<RawPortfolioData> {
    await dbConnect();

    const [projects, skills, education, experience, certificates, testScores] = await Promise.all([
        Project_Model().find({ isDeleted: { $ne: true }, Published: true }).lean(),
        Skill_Model().find({ isDeleted: { $ne: true }, Visible: true }).lean(),
        Education_Model().find({ isDeleted: { $ne: true }, Published: true }).lean(),
        Experience_Model().find({ isDeleted: { $ne: true }, Published: true }).lean(),
        Certificate_Model().find({ isDeleted: { $ne: true }, Published: true }).lean(),
        TestScore_Model().find({ isDeleted: { $ne: true } }).lean()
    ]);

    return { projects, skills, education, experience, certificates, testScores };
}

// ── Minify Portfolio Data for Token Efficiency ───────────────────────────────

function minifyPortfolioData(data: RawPortfolioData): string {
    const min = {
        e: data.experience.map((x: any) => ({
            id: x.ExperienceID,
            t: x.Role,
            co: x.Company,
            et: x.EmploymentType,
            sd: x.StartDate,
            ed: x.EndDate,
            cw: x.CurrentlyWorking,
            loc: x.Location,
            lt: x.LocationType,
            d: x.Description,
            r: x.Responsibilities,
            a: x.Achievements,
            ts: x.TechStack
        })),
        s: data.education.map((x: any) => ({
            id: x.EducationID,
            inst: x.Institution,
            deg: x.Degree,
            f: x.FieldOfStudy,
            g: x.Grade,
            mg: x.MaxGrade,
            gt: x.GradeType,
            sd: x.StartDate,
            ed: x.EndDate,
            cs: x.CurrentlyStudying,
            loc: x.Location,
            d: x.Description,
            a: x.Achievements
        })),
        p: data.projects.map((x: any) => ({
            id: x.ProjectID,
            t: x.Title,
            d: x.Description,
            ld: x.LongDescription,
            type: x.Type,
            st: x.Status,
            ft: x.Featured,
            ts: x.TechStack,
            cat: x.Category,
            tags: x.Tags,
            sd: x.StartDate,
            ed: x.EndDate
        })),
        c: data.certificates.map((x: any) => ({
            id: x.CertificateID,
            t: x.Title,
            org: x.IssuingOrganization,
            dt: x.IssuedDate,
            d: x.Description,
            sk: x.Skills
        })),
        sk: data.skills.map((x: any) => ({
            id: x.SkillID,
            n: x.Name,
            cat: x.Category,
            pr: x.Proficiency,
            ye: x.YearsOfExperience
        })),
        ts: data.testScores.map((x: any) => ({
            id: x.TestScoreID,
            n: x.ExamName,
            type: x.ExamType,
            sc: x.Score,
            ms: x.MaxScore,
            pct: x.Percentile,
            rk: x.Rank,
            yr: x.Year,
            sub: x.Subject,
            d: x.Description
        }))
    };

    return JSON.stringify(min);
}

// ── AI Provider Call ─────────────────────────────────────────────────────────

interface AICallConfig {
    provider: AIProviderKey;
    apiKey: string;
    modelsToTry: string[];
    baseUrl: string;
}

async function resolveAIConfig(): Promise<AICallConfig> {
    await dbConnect();
    const settings = await getAIProviderSettings();

    const providerKeys = Object.keys(settings.Providers) as AIProviderKey[];
    const resolvedApiKeys = Object.fromEntries(
        providerKeys.map((k) => {
            try {
                let key = decryptStoredSecret(settings.Providers[k].apiKey || "");
                // Aggressively clean the API key: remove quotes, spaces, and non-printable characters
                key = key.replace(/['"\s\x00-\x1F\x7F-\x9F]/g, "").trim();
                if (key === "undefined" || key === "null") return [k, ""];
                return [k, key];
            } catch {
                return [k, ""];
            }
        })
    ) as Record<AIProviderKey, string>;

    const activeProvider = settings.ActiveProvider;
    let providerKey = activeProvider;
    let providerConfig = settings.Providers[providerKey];
    let apiKey = resolvedApiKeys[providerKey];

    if (!providerConfig?.enabled || !apiKey) {
        const fallback = providerKeys.find((k) => settings.Providers[k].enabled && resolvedApiKeys[k]);
        if (!fallback) {
            throw new Error(`No enabled AI provider with a valid API key was found. Configure it in Admin > AI Providers.`);
        }
        providerKey = fallback;
        providerConfig = settings.Providers[providerKey];
        apiKey = resolvedApiKeys[providerKey];
    }

    const activeModel = providerConfig.activeModel;
    const allModels = AI_PROVIDERS[providerKey].models;
    const modelsToTry = activeModel 
        ? [activeModel, ...allModels.filter(m => m !== activeModel)]
        : [...allModels];

    const baseUrl = providerConfig.customBaseUrl || AI_PROVIDERS[providerKey].baseUrl;

    return { provider: providerKey, apiKey, modelsToTry, baseUrl };
}

async function callAI(
    config: AICallConfig,
    systemPrompt: string,
    userPrompt: string
): Promise<{ text: string; modelUsed: string }> {
    const { provider, apiKey, modelsToTry, baseUrl } = config;

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
        try {
            if (provider === "google") {
                // Google Gemini — uses their native REST API
                const url = `${baseUrl}/models/${model}:generateContent`;
                const res = await fetch(url, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey 
                    },
                    body: JSON.stringify({
                        contents: [
                            { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
                        ],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.3,
                            maxOutputTokens: 8192
                        }
                    })
                });

                if (!res.ok) {
                    const err = await res.text();
                    throw new Error(`Gemini API error (${res.status}): ${err}`);
                }

                const data = await res.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Empty response from Gemini");
                return { text, modelUsed: model };
            }

            // GitHub Models (Azure AI) / Perplexity / OpenRouter — OpenAI-compatible chat completion
            const defaultHeaders: Record<string, string> = {};
            if (provider === "openrouter") {
                defaultHeaders["HTTP-Referer"] = "https://productivity-hub.local";
                defaultHeaders["X-Title"] = "Productivity Hub";
                defaultHeaders["Authorization"] = `Bearer ${apiKey}`;
            }

            const openai = new OpenAI({
                baseURL: baseUrl,
                apiKey: apiKey,
                defaultHeaders,
                fetch: async (url, init) => {
                    const reqHeaders = new Headers(init?.headers);
                    reqHeaders.set("Authorization", `Bearer ${apiKey}`);
                    return globalThis.fetch(url, { ...init, headers: reqHeaders });
                }
            });

            const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 4000,
                response_format: { type: "json_object" }
            });

            const content = completion.choices?.[0]?.message?.content;
            if (!content) throw new Error(`Empty response from ${provider}`);
            return { text: content, modelUsed: model };
        } catch (err: any) {
            console.warn(`[AI Fallback] Model ${model} failed: ${err.message}`);
            lastError = err;
        }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

// ── Main Pipeline ────────────────────────────────────────────────────────────

export interface ResumeAIInput {
    /** Raw job description text (may be copied from GitHub/LinkedIn/etc.) */
    jobDescription: string;
    /** Optional: user's name override for the header */
    name?: string;
    /** Optional: desired title override */
    title?: string;
}

export interface ResumeAIResult {
    /** The compressed resume JSON from AI */
    data: CompressedResumeOutput;
    /** Provider used */
    provider: AIProviderKey;
    /** Model used */
    model: string;
    /** Processing time in ms */
    processingTimeMs: number;
}

/**
 * Generate a tailored resume using AI.
 *
 * 1. Loads all portfolio data from DB
 * 2. Minifies to token-efficient JSON
 * 3. Builds system + user prompts
 * 4. Calls AI provider
 * 5. Parses and validates response
 */
export async function generateTailoredResume(input: ResumeAIInput): Promise<ResumeAIResult> {
    const startTime = Date.now();

    // 1. Load portfolio data
    const portfolioData = await loadPortfolioData();

    // 2. Minify for token efficiency
    const minified = minifyPortfolioData(portfolioData);

    // 3. Resolve AI provider config
    const aiConfig = await resolveAIConfig();

    // 4. Build user prompt
    const userPrompt = buildUserPrompt(input, minified);

    // 5. Call AI
    const aiResult = await callAI(aiConfig, SYSTEM_PROMPT, userPrompt);
    const rawResponse = aiResult.text;

    // 6. Parse response
    const parsed = parseAIResponse(rawResponse);

    return {
        data: parsed,
        provider: aiConfig.provider,
        model: aiResult.modelUsed,
        processingTimeMs: Date.now() - startTime
    };
}

function buildUserPrompt(input: ResumeAIInput, minifiedData: string): string {
    let prompt = `JOB DESCRIPTION:\n${input.jobDescription}\n\nRESUME DATA (compressed JSON):\n${minifiedData}`;

    if (input.name) {
        prompt += `\n\nUSER NAME: ${input.name}`;
    }
    if (input.title) {
        prompt += `\nDESIRED TITLE: ${input.title}`;
    }

    prompt += `\n\nAnalyze the job description above and produce a tailored resume as compressed JSON. Follow the system prompt schema exactly.`;

    return prompt;
}

function parseAIResponse(raw: string): CompressedResumeOutput {
    // Strip potential markdown code fences
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
        const parsed = JSON.parse(cleaned);

        // Basic validation
        if (!parsed || typeof parsed !== "object") {
            throw new Error("AI response is not a valid JSON object");
        }

        // Ensure required fields exist with defaults
        return {
            n: parsed.n || "",
            t: parsed.t || "",
            su: parsed.su || "",
            so: Array.isArray(parsed.so) ? parsed.so : ["e", "sk", "p", "s", "c", "ts"],
            rs: typeof parsed.rs === "number" ? parsed.rs : 50,
            e: Array.isArray(parsed.e) ? parsed.e : [],
            s: Array.isArray(parsed.s) ? parsed.s : [],
            p: Array.isArray(parsed.p) ? parsed.p : [],
            po: Array.isArray(parsed.po) ? parsed.po : [],
            c: Array.isArray(parsed.c) ? parsed.c : [],
            sk: Array.isArray(parsed.sk) ? parsed.sk : [],
            ts: Array.isArray(parsed.ts) ? parsed.ts : []
        };
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
}
