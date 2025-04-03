import { execSync } from "child_process"
import fs from "fs"

const commitMessage = execSync("git log -1 --pretty=%B").toString().trim()
const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown"

console.log(`📝 Commit Message: "${commitMessage}"`)
console.log(`🌿 Branch: ${branch}`)

if (commitMessage.includes("NO_DEPLOY")) {
    console.log("🚫 Skipping deployment due to NO_DEPLOY in commit message.")
    
    // Block deployment at the Vercel config level
    fs.writeFileSync(".env", "DEPLOY_BLOCKED=true\n")

    throw new Error("❌ FATAL: Deployment is explicitly disabled by commit message.")
}

// Make sure the env variable isn't blocking normal builds
fs.writeFileSync(".env", "DEPLOY_BLOCKED=false\n")

console.log("✅ Proceeding with deployment.")
