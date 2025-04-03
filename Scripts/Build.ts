import { execSync } from "child_process"
import { $ } from "bun";

function isDeployBlockedByCommitMessage(): boolean {
    let commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
    
    console.log(`📝 Commit Message: "${commitMessage}"`);
    return commitMessage.includes('NO_DEPLOY');
}

async function isDeployBlockedByRepository() {
    const APIFile = "https://raw.githubusercontent.com/MeetBhingradiya/Portfolio-RemoteState/refs/heads/Release/State.json";
    const response = await fetch(APIFile);
    const data = await response.json();

    let branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
    console.log(`🌿 Branch: ${branch}`);

    if (branch !== "Release") {
        console.log("🚫 Skipping deployment due to branch not being Release.");
        return true;
    }

    if (data?.File["CI/CD_Pipeline"].Release === "false") {
        return false;
    } else {
        return true;
    }
}

async function main() {

    if (isDeployBlockedByCommitMessage()) {
        console.log("🚫 Skipping deployment due to NO_DEPLOY in commit message.");
        return;
    }

    if (await isDeployBlockedByRepository()) {
        console.log("🚫 Skipping deployment due to remote repository settings.");
        return;
    }

    console.log("✅ Proceeding with deployment.");

    await $`next build`;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});