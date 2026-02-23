import { execSync } from "child_process";

interface DeploymentCheckState {
    CommitMessage: string;
    BlockKeywords: string[];
}

const DeploymentCheckState: DeploymentCheckState = {
    CommitMessage: "",
    BlockKeywords: [
        "NO_DEPLOY",
        "SKIP_DEPLOY",
        "DEPLOY_BLOCKED",
        "DEPLOY_DISABLED",
        "STOP_DEPLOY",
        "README",
        "No Deploy",
        "no deploy"
    ]
};

function isDeployBlockedByCommitMessage(commitMessage: string): boolean {
    for (const keyword of DeploymentCheckState.BlockKeywords) {
        if (commitMessage.includes(keyword)) {
            console.log(
                `🚫 Deployment blocked by commit message containing "${keyword}".`
            );
            return true;
        }
    }
    return false;
}

(async function main() {
    const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD")
        .toString()
        .trim();

    console.log(`📝 Commit Message: "${commitMessage}"`);
    console.log(`🌿 Branch: ${branch}`);

    DeploymentCheckState.CommitMessage = commitMessage;

    console.log("🔍 Checking Deployment Conditions on Commit Message...");
    if (isDeployBlockedByCommitMessage(commitMessage)) {
        console.log("❌ Vercel does not have permission to deploy this Commit");
        process.exit(0);
    }

    console.log("✅ Vercel has permission to deploy this Commit");
    process.exit(1);
})();
