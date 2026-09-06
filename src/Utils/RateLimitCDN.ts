/**
 * Rate Limit CDN Utility
 *
 * Server-side utility (NOT Edge-compatible) for reading/writing the
 * rate limit configuration JSON to the GitHub CDN repository.
 *
 * Uses the existing GitHubCDN infrastructure for file operations
 * and serves the config via raw.githubusercontent.com for Edge access.
 *
 * Config path: config/rate-limits.json in the first PrivateCloud-* repo
 */

import { githubUpload, githubDownload, githubStat, listCDNRepos, type RepoInfo } from "@Utils/GitHubCDN";
import type { RateLimitConfig } from "@Library/RateLimit/RateLimitConfig";
import { DEFAULT_RATE_LIMIT_CONFIG } from "@Library/RateLimit/RateLimitConfig";

const CONFIG_PATH = "config/rate-limits.json";

/**
 * Resolve which GitHub repo stores the rate limit config.
 * Uses the first PrivateCloud-* repo (smallest/first in sorted order).
 */
async function resolveConfigRepo(): Promise<RepoInfo> {
    const repos = await listCDNRepos();
    if (repos.length === 0) {
        throw new Error(
            "No CDN repositories found. Create at least one repo with the PrivateCloud prefix."
        );
    }
    return repos[0];
}

/**
 * Read the current rate limit configuration from the GitHub CDN repo.
 * Returns the parsed config or null if the file doesn't exist yet.
 */
export async function readRateLimitConfigFromCDN(): Promise<RateLimitConfig | null> {
    try {
        const repo = await resolveConfigRepo();
        const result = await githubDownload(repo.name, CONFIG_PATH);

        if (!result) return null;

        const text = result.buffer.toString("utf-8");
        const parsed = JSON.parse(text);
        return parsed as RateLimitConfig;
    } catch (error) {
        console.error("[RateLimitCDN] Failed to read config from GitHub:", error);
        return null;
    }
}

/**
 * Write the rate limit configuration to the GitHub CDN repo.
 * This creates or updates the config/rate-limits.json file.
 *
 * After writing, the config is available via:
 *   https://raw.githubusercontent.com/{owner}/{repo}/{branch}/config/rate-limits.json
 *
 * @param config - The complete rate limit configuration to write
 * @param updatedBy - Email/name of the admin who made the change
 */
export async function writeRateLimitConfigToCDN(
    config: RateLimitConfig,
    updatedBy: string
): Promise<{ repo: string; sha: string; rawUrl: string }> {
    const repo = await resolveConfigRepo();

    // Update metadata
    const updatedConfig: RateLimitConfig = {
        ...config,
        updatedAt: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(updatedConfig, null, 2);
    const buffer = Buffer.from(jsonContent, "utf-8");

    // Check if file exists (need SHA for update)
    const existing = await githubStat(repo.name, CONFIG_PATH);

    let result;
    if (existing) {
        // File exists — need to delete and re-upload (GitHub API requires SHA for updates)
        // Actually, githubUpload handles this via PUT with content
        result = await githubUpload(
            CONFIG_PATH,
            buffer,
            `rate-limits: updated by ${updatedBy}`,
            repo.name,
            existing.sha
        );
    } else {
        result = await githubUpload(
            CONFIG_PATH,
            buffer,
            `rate-limits: initial config by ${updatedBy}`,
            repo.name
        );
    }

    const owner = process.env.CDN_GITHUB_OWNER;
    const branch = process.env.CDN_GITHUB_BRANCH || "main";
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo.name}/${branch}/${CONFIG_PATH}`;

    return {
        repo: repo.name,
        sha: result.sha,
        rawUrl
    };
}

/**
 * Initialize the rate limit config in the GitHub CDN repo if it doesn't exist.
 * Creates the config file with sensible defaults.
 */
export async function ensureRateLimitConfigExists(): Promise<RateLimitConfig> {
    const existing = await readRateLimitConfigFromCDN();
    if (existing) return existing;

    // Create default config
    const defaultConfig: RateLimitConfig = {
        ...DEFAULT_RATE_LIMIT_CONFIG,
        updatedAt: new Date().toISOString()
    };

    await writeRateLimitConfigToCDN(defaultConfig, "system-init");
    return defaultConfig;
}

/**
 * Get the raw GitHub CDN URL for the rate limit config.
 * This URL is used by the Edge proxy to fetch the config.
 */
export function getRateLimitConfigRawUrl(): string | null {
    const owner = process.env.CDN_GITHUB_OWNER;
    const prefix = process.env.CDN_GITHUB_REPO_PREFIX || "PrivateCloud";
    const branch = process.env.CDN_GITHUB_BRANCH || "main";

    if (!owner) return null;

    return `https://raw.githubusercontent.com/${owner}/${prefix}-1/${branch}/${CONFIG_PATH}`;
}
