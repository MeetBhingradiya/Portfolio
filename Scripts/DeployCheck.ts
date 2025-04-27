import { execSync } from "child_process";

async function isDeployBlockedByRepository(): Promise<boolean> {
    const APIFile = "https://raw.githubusercontent.com/MeetBhingradiya/Portfolio-RemoteState/refs/heads/Release/State.json";
    
    try {
        const response = await fetch(APIFile);
        const data = await response.json();

        let branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
        console.log(`🌿 Branch: ${branch}`);

        if (data?.File["CI/CD_Pipeline"].Release === false) {
            console.log("🚫 Deployment blocked by remote repository settings.");
            return true;
        }

        console.log("✅ Deployment Authorized By Remote Repository Settings.");
    } catch (error) {
        console.error("⚠️ Error fetching repository state:", error);
        return false;
    }

    return false;
}

(async function main() {
    const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
    console.log(`📝 Commit Message: "${commitMessage}"`);

    if (commitMessage.includes("NO_DEPLOY")) {
        console.log("🚫 Deployment blocked by commit message.");
        process.exit(0);
    }

    if (await isDeployBlockedByRepository()) {
        process.exit(0);
    }

    console.log("✅ Proceeding with deployment.");
    process.exit(1);
})()