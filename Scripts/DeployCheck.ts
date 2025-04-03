import { execSync } from "child_process";

const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";

console.log(`📝 Commit Message: "${commitMessage}"`);
console.log(`🌿 Branch: ${branch}`);

if (commitMessage.includes("NO_DEPLOY")) {
    console.log("🚫 Skipping deployment due to NO_DEPLOY in commit message.");
    throw new Error("❌ FATAL: Deployment is explicitly disabled by commit message.");
    process.exit(1);
}

console.log("✅ Proceeding with deployment.");
process.exit(0);