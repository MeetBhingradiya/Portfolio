/// <reference types="node" />

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import type { Dirent } from "fs";
import { copyFile, lstat, mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { decryptLargeBuffer, encryptLargeBuffer, ensureRepoKeys, loadRepoKeys } from "./CryptoUtils";

interface SyncOptions {
    sourceDir: string;
    targetDir: string;
    commitMessage: string;
    encrypt: boolean;
    checkout: boolean;
    repoUrl: string;
    repoDir: string;
    repoBranch: string;
    repoEncryptedDir: string;
    repoKeysDir: string;
    push: boolean;
}

const ignoredNames = new Set([".git"]);
const DEFAULT_PRIVATE_REPO_URL = "https://github.com/MeetBhingradiya/Portfolio-Environment";

function getCheckoutInitMessage(): string {
    return [
        "Private env repo is not initialized yet.",
        "Run this once to create keys + encrypted env files in the private repo:",
        "  bun run EnvSync",
        "Then run checkout again:",
        "  bun run EnvCheckout"
    ].join("\n");
}

function parseArgs(argv: string[]): SyncOptions {
    const options: SyncOptions = {
        sourceDir: "env",
        targetDir: "env",
        commitMessage: "chore: update encrypted environment snapshot",
        encrypt: false,
        checkout: false,
        repoUrl: DEFAULT_PRIVATE_REPO_URL,
        repoDir: ".private-env-repo",
        repoBranch: "main",
        repoEncryptedDir: "env",
        repoKeysDir: "keys",
        push: true
    };

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument === "--source" && argv[index + 1]) {
            options.sourceDir = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--target" && argv[index + 1]) {
            options.targetDir = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--encrypt") {
            options.encrypt = true;
            continue;
        }

        if (argument === "--checkout") {
            options.checkout = true;
            continue;
        }

        if (argument === "--repo-url" && argv[index + 1]) {
            options.repoUrl = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--repo-dir" && argv[index + 1]) {
            options.repoDir = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--repo-branch" && argv[index + 1]) {
            options.repoBranch = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--repo-encrypted-dir" && argv[index + 1]) {
            options.repoEncryptedDir = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--repo-keys-dir" && argv[index + 1]) {
            options.repoKeysDir = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--message" && argv[index + 1]) {
            options.commitMessage = argv[index + 1];
            index += 1;
            continue;
        }

        if (argument === "--no-push") {
            options.push = false;
            continue;
        }
    }

    return options;
}

function runGit(args: string[], cwd?: string, allowFailure = false): string {
    const result = spawnSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0 && !allowFailure) {
        const output = [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean).join("\n");
        throw new Error(`git ${args.join(" ")} failed${output ? `:\n${output}` : ""}`);
    }

    return (result.stdout || "").trim();
}

async function copyEntry(sourcePath: string, targetPath: string): Promise<void> {
    const stats = await lstat(sourcePath);

    if (stats.isDirectory()) {
        await mkdir(targetPath, { recursive: true });

        const entries = await readdir(sourcePath, { withFileTypes: true });
        const sourceNames = new Set(entries.map((entry: Dirent) => entry.name));
        const targetEntries = await readdir(targetPath, { withFileTypes: true }).catch(() => [] as Dirent[]);

        for (const targetEntry of targetEntries) {
            if (ignoredNames.has(targetEntry.name) || sourceNames.has(targetEntry.name)) {
                continue;
            }

            await rm(resolve(targetPath, targetEntry.name), { force: true, recursive: true });
        }

        for (const entry of entries) {
            if (ignoredNames.has(entry.name)) {
                continue;
            }

            await copyEntry(resolve(sourcePath, entry.name), resolve(targetPath, entry.name));
        }

        return;
    }

    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
}

async function mirrorFolder(sourceDir: string, targetDir: string): Promise<void> {
    const resolvedSource = resolve(sourceDir);
    const resolvedTarget = resolve(targetDir);

    if (resolvedSource === resolvedTarget) {
        return;
    }

    await copyEntry(resolvedSource, resolvedTarget);
}

function repoHasChanges(repoDir: string, paths: string[]): boolean {
    const status = runGit(["status", "--porcelain", "--", ...paths], repoDir);
    return status.trim().length > 0;
}

function ensurePrivateRepo(options: SyncOptions): string {
    const repoDirAbs = resolve(options.repoDir);

    const hasGitDir = existsSync(repoDirAbs) && runGit(["rev-parse", "--is-inside-work-tree"], repoDirAbs, true) === "true";
    if (!hasGitDir) {
        runGit(["clone", options.repoUrl, repoDirAbs]);
    }

    const localBranches = runGit(["branch", "--list", options.repoBranch], repoDirAbs, true);
    if (localBranches.trim().length > 0) {
        runGit(["checkout", options.repoBranch], repoDirAbs);
    } else {
        const remoteBranch = runGit(["ls-remote", "--heads", "origin", options.repoBranch], repoDirAbs, true);
        if (remoteBranch.trim().length > 0) {
            runGit(["checkout", "-b", options.repoBranch, `origin/${options.repoBranch}`], repoDirAbs);
        } else {
            runGit(["checkout", "-b", options.repoBranch], repoDirAbs);
        }
    }

    runGit(["pull", "--ff-only", "origin", options.repoBranch], repoDirAbs, true);
    return repoDirAbs;
}

async function encryptDirectoryToRepo(sourceDir: string, repoEncryptedDirAbs: string, publicKey: string): Promise<void> {
    await mkdir(repoEncryptedDirAbs, { recursive: true });
    const entries = await readdir(sourceDir, { withFileTypes: true });
    const sourceNames = new Set(entries.map((entry: Dirent) => entry.name));

    const targetEntries = await readdir(repoEncryptedDirAbs, { withFileTypes: true }).catch(() => [] as Dirent[]);
    for (const targetEntry of targetEntries) {
        const targetName = targetEntry.name.endsWith(".encrypted")
            ? targetEntry.name.slice(0, -".encrypted".length)
            : targetEntry.name;
        if (!sourceNames.has(targetName)) {
            await rm(resolve(repoEncryptedDirAbs, targetEntry.name), { recursive: true, force: true });
        }
    }

    for (const entry of entries) {
        const sourcePath = resolve(sourceDir, entry.name);
        if (entry.isDirectory()) {
            await encryptDirectoryToRepo(sourcePath, resolve(repoEncryptedDirAbs, entry.name), publicKey);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const encrypted = encryptLargeBuffer(await readFile(sourcePath), publicKey);
        await writeFile(resolve(repoEncryptedDirAbs, `${entry.name}.encrypted`), encrypted);
    }
}

async function decryptDirectoryFromRepo(repoEncryptedDirAbs: string, localTargetDir: string, privateKey: string): Promise<void> {
    await mkdir(localTargetDir, { recursive: true });
    const entries = await readdir(repoEncryptedDirAbs, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = resolve(repoEncryptedDirAbs, entry.name);
        if (entry.isDirectory()) {
            await decryptDirectoryFromRepo(sourcePath, resolve(localTargetDir, entry.name), privateKey);
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith(".encrypted")) {
            continue;
        }

        const originalName = entry.name.slice(0, -".encrypted".length);
        const targetPath = resolve(localTargetDir, originalName);
        await mkdir(dirname(targetPath), { recursive: true });
        const decrypted = decryptLargeBuffer(await readFile(sourcePath), privateKey);
        await writeFile(targetPath, decrypted);
    }
}

async function main(): Promise<void> {
    const options = parseArgs(process.argv.slice(2));
    const repoDirAbs = ensurePrivateRepo(options);
    const keys = options.encrypt
        ? ensureRepoKeys(repoDirAbs, options.repoKeysDir)
        : (() => {
              try {
                  return loadRepoKeys(repoDirAbs, options.repoKeysDir);
              } catch {
                  throw new Error(getCheckoutInitMessage());
              }
          })();

    const repoEncryptedDirAbs = resolve(repoDirAbs, options.repoEncryptedDir);

    if (options.checkout) {
        if (!existsSync(repoEncryptedDirAbs)) {
            throw new Error(getCheckoutInitMessage());
        }
        await decryptDirectoryFromRepo(repoEncryptedDirAbs, resolve(options.targetDir), keys.privateKey);
        console.log("Checkout complete.");
        return;
    }

    if (!options.encrypt) {
        await mirrorFolder(resolve(options.sourceDir), resolve(options.targetDir));
        console.log("Mirror sync complete.");
        return;
    }

    await encryptDirectoryToRepo(resolve(options.sourceDir), repoEncryptedDirAbs, keys.publicKey);
    const pathsToTrack = [options.repoKeysDir, options.repoEncryptedDir];

    if (!repoHasChanges(repoDirAbs, pathsToTrack)) {
        console.log("No encrypted changes detected.");
        return;
    }

    runGit(["add", "--", ...pathsToTrack], repoDirAbs);
    runGit(["commit", "-m", options.commitMessage], repoDirAbs);
    if (options.push) {
        runGit(["push", "origin", options.repoBranch], repoDirAbs);
    }
    console.log("Encrypted sync complete.");
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});