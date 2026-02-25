/**
 * GitHub CDN Utility — Multi-Repo Edition
 *
 * Automatically discovers all repositories whose name starts with
 * CDN_GITHUB_REPO_PREFIX (default: "PrivateCloud") under your account
 * and distributes uploads across them, always picking the repo with
 * the most free space.
 *
 * Required env vars:
 *   CDN_GITHUB_TOKEN       — PAT (classic) with `repo` scope
 *   CDN_GITHUB_OWNER       — GitHub username or organisation
 *
 * Optional env vars:
 *   CDN_GITHUB_REPO_PREFIX — Prefix repos must start with  (default: "PrivateCloud")
 *   CDN_GITHUB_BRANCH      — Branch to write to            (default: "main")
 *   CDN_REPO_SIZE_LIMIT_KB — Soft cap in KB before a repo is skipped (default: 900_000 ≈ 900 MB)
 *
 * Repo discovery is cached for 5 minutes inside the same serverless instance.
 */

const BASE = "https://api.github.com";
const DEFAULT_PREFIX = "PrivateCloud";
const DEFAULT_LIMIT_KB = 900_000; // ~900 MB
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

function getToken() {
    const t = process.env.CDN_GITHUB_TOKEN;
    if (!t) throw new Error("CDN_GITHUB_TOKEN is not set.");
    return t;
}

function getOwner() {
    const o = process.env.CDN_GITHUB_OWNER;
    if (!o) throw new Error("CDN_GITHUB_OWNER is not set.");
    return o;
}

function getPrefix() {
    return process.env.CDN_GITHUB_REPO_PREFIX || DEFAULT_PREFIX;
}

function getBranch() {
    return process.env.CDN_GITHUB_BRANCH || "main";
}

function getSizeLimitKb() {
    return parseInt(process.env.CDN_REPO_SIZE_LIMIT_KB || String(DEFAULT_LIMIT_KB), 10);
}

function ghHeaders(tk: string) {
    return {
        Authorization: `Bearer ${tk}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    };
}

// ---------------------------------------------------------------------------
// Repository info
// ---------------------------------------------------------------------------

export interface RepoInfo {
    name: string;      // repo name only, e.g. "PrivateCloud-1"
    fullName: string;  // "owner/PrivateCloud-1"
    sizeKb: number;    // GitHub's `size` field (KB, approximate)
    private: boolean;
}

// ---------------------------------------------------------------------------
// In-process cache (reused across requests in the same serverless warm instance)
// ---------------------------------------------------------------------------

let _repoCache: RepoInfo[] | null = null;
let _repoCacheAt = 0;

/**
 * List every repo on the authenticated account whose name starts with the
 * configured prefix. Results are cached for 5 minutes.
 */
export async function listCDNRepos(forceRefresh = false): Promise<RepoInfo[]> {
    if (!forceRefresh && _repoCache && Date.now() - _repoCacheAt < CACHE_TTL_MS) {
        return _repoCache;
    }

    const tk = getToken();
    const ow = getOwner();
    const pfx = getPrefix().toLowerCase();
    const results: RepoInfo[] = [];
    let page = 1;

    while (true) {
        const url = `${BASE}/user/repos?per_page=100&page=${page}&type=all&sort=full_name`;
        const res = await fetch(url, { headers: ghHeaders(tk), cache: "no-store" });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`GitHub repo list failed (${res.status}): ${body}`);
        }

        const repos: any[] = await res.json();
        if (repos.length === 0) break;

        for (const r of repos) {
            if (
                typeof r.name === "string" &&
                r.name.toLowerCase().startsWith(pfx) &&
                r.owner?.login?.toLowerCase() === ow.toLowerCase()
            ) {
                results.push({
                    name: r.name,
                    fullName: r.full_name,
                    sizeKb: r.size ?? 0,
                    private: r.private ?? false,
                });
            }
        }

        if (repos.length < 100) break;
        page++;
    }

    if (results.length === 0) {
        throw new Error(
            `No CDN repositories found with prefix "${getPrefix()}" under account "${ow}". ` +
            `Create at least one private repo named "${getPrefix()}-1".`
        );
    }

    // Sort ascending by size — smallest (most room) first
    results.sort((a, b) => a.sizeKb - b.sizeKb);

    _repoCache = results;
    _repoCacheAt = Date.now();
    return results;
}

/**
 * Determine the next sequential repo name, e.g.:
 *   existing: ["PrivateCloud-1", "PrivateCloud-2"]  →  "PrivateCloud-3"
 *   existing: []                                     →  "PrivateCloud-1"
 */
function nextRepoName(existing: RepoInfo[]): string {
    const pfx = getPrefix();
    let max = 0;
    for (const r of existing) {
        const suffix = r.name.slice(pfx.length).replace(/^-/, "");
        const n = parseInt(suffix, 10);
        if (!isNaN(n) && n > max) max = n;
    }
    return `${pfx}-${max + 1}`;
}

/**
 * Create a new private CDN repository on GitHub, initialise it with a
 * README so it has at least one commit and upload targets work immediately.
 * Returns the new RepoInfo and invalids the local cache.
 */
async function createNextCDNRepo(existing: RepoInfo[]): Promise<RepoInfo> {
    const tk = getToken();
    const ow = getOwner();
    const name = nextRepoName(existing);

    console.info(`[GitHub CDN] All repos at capacity — creating new repo: ${ow}/${name}`);

    const res = await fetch(`${BASE}/user/repos`, {
        method: "POST",
        headers: ghHeaders(tk),
        body: JSON.stringify({
            name,
            description: "Private CDN storage repository — managed automatically",
            private: true,
            auto_init: true,   // creates initial commit so the repo is ready immediately
            has_issues: false,
            has_projects: false,
            has_wiki: false,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[GitHub CDN] Failed to create new repo "${name}" (${res.status}): ${body}`);
    }

    const data = await res.json();
    const info: RepoInfo = {
        name: data.name as string,
        fullName: data.full_name as string,
        sizeKb: 0,
        private: true,
    };

    // Invalidate cache so subsequent calls see the new repo
    _repoCache = null;

    console.info(`[GitHub CDN] Successfully created ${info.fullName} — it will be used for future uploads.`);
    return info;
}

/**
 * Return the best repo for uploading:
 * - Must be under the size soft-cap
 * - Prefer smallest repo (most free space)
 * - If ALL repos are over the cap, automatically creates the next
 *   "PrivateCloud-N" repo so uploads never fail.
 */
export async function resolveBestRepo(): Promise<RepoInfo> {
    const repos = await listCDNRepos();
    const limit = getSizeLimitKb();
    const available = repos.filter((r) => r.sizeKb < limit);

    if (available.length > 0) return available[0];

    // All repos are full — spin up a new one automatically
    return createNextCDNRepo(repos);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GitHubUploadResult {
    repo: string;  // e.g. "PrivateCloud-1"
    sha: string;
    path: string;
}

export interface GitHubFileInfo {
    sha: string;
    size: number;
    exists: true;
}

// ---------------------------------------------------------------------------
// Upload — auto-selects the best available repo
// ---------------------------------------------------------------------------

export async function githubUpload(
    path: string,           // path inside the repo, e.g. "uploads/avatars/abc123.png"
    contentBuffer: Buffer,
    commitMessage: string,
    targetRepo?: string     // optional override: use a specific repo name
): Promise<GitHubUploadResult> {
    const tk = getToken();
    const ow = getOwner();
    const br = getBranch();

    let repoName: string;
    if (targetRepo) {
        repoName = targetRepo;
    } else {
        const best = await resolveBestRepo();
        repoName = best.name;
        // Invalidate cache so the next upload sees the updated size
        _repoCache = null;
    }

    const url = `${BASE}/repos/${ow}/${repoName}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;

    const res = await fetch(url, {
        method: "PUT",
        headers: ghHeaders(tk),
        body: JSON.stringify({
            message: commitMessage,
            content: contentBuffer.toString("base64"),
            branch: br,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`GitHub upload failed in "${repoName}" (${res.status}): ${body}`);
    }

    const data = await res.json();
    return {
        repo: repoName,
        sha: data.content.sha as string,
        path: data.content.path as string,
    };
}

// ---------------------------------------------------------------------------
// Stat — check existence in a specific repo
// ---------------------------------------------------------------------------

export async function githubStat(repo: string, path: string): Promise<GitHubFileInfo | null> {
    const tk = getToken();
    const ow = getOwner();
    const br = getBranch();

    const url = `${BASE}/repos/${ow}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${br}`;
    const res = await fetch(url, { headers: ghHeaders(tk), cache: "no-store" });

    if (res.status === 404) return null;
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`GitHub stat failed in "${repo}" (${res.status}): ${body}`);
    }

    const data = await res.json();
    return { sha: data.sha as string, size: data.size as number, exists: true };
}

// ---------------------------------------------------------------------------
// Download — proxy bytes from a specific repo (works for private repos)
// ---------------------------------------------------------------------------

export async function githubDownload(
    repo: string,
    path: string
): Promise<{ buffer: Buffer; size: number } | null> {
    const tk = getToken();
    const ow = getOwner();
    const br = getBranch();

    const metaUrl = `${BASE}/repos/${ow}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${br}`;
    const metaRes = await fetch(metaUrl, { headers: ghHeaders(tk), cache: "no-store" });

    if (metaRes.status === 404) return null;
    if (!metaRes.ok) return null;

    const meta = await metaRes.json();

    // ≤ 1 MB: GitHub returns base64 content inline
    if (meta.content && meta.encoding === "base64") {
        const buffer = Buffer.from((meta.content as string).replace(/\n/g, ""), "base64");
        return { buffer, size: buffer.length };
    }

    // > 1 MB: follow download_url with auth header (required for private repos)
    if (meta.download_url) {
        const rawRes = await fetch(meta.download_url as string, {
            headers: { Authorization: `Bearer ${tk}` },
            cache: "no-store",
        });
        if (!rawRes.ok) return null;
        const buffer = Buffer.from(await rawRes.arrayBuffer());
        return { buffer, size: buffer.length };
    }

    return null;
}

// ---------------------------------------------------------------------------
// Delete — remove a file from a specific repo by SHA
// ---------------------------------------------------------------------------

export async function githubDelete(
    repo: string,
    path: string,
    sha: string,
    commitMessage: string
): Promise<void> {
    const tk = getToken();
    const ow = getOwner();
    const br = getBranch();

    const url = `${BASE}/repos/${ow}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: ghHeaders(tk),
        body: JSON.stringify({ message: commitMessage, sha, branch: br }),
    });

    if (!res.ok && res.status !== 404) {
        const body = await res.text();
        throw new Error(`GitHub delete failed in "${repo}" (${res.status}): ${body}`);
    }
}
