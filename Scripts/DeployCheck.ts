import { execSync } from "child_process";

interface IConstants {
    RemoteFile: string;
    RemoteFileBranch: string;
}

interface DeploymentCheckState {
    CommitMessage: string;
    RemoteDeployPermission: boolean;
    CommitMessageActions: {
        words: string[];
        description: string;
        bypassRepositoryAuthorization?: boolean;
        action: "block" | "allow";
    }[];
}

const Constants: IConstants = {
    RemoteFile:
        "https://raw.githubusercontent.com/MeetBhingradiya/Portfolio-RemoteState/refs/heads/Release/State.json",
    RemoteFileBranch: "Release"
};

let DeploymentCheckState: DeploymentCheckState = {
    CommitMessage: "",
    RemoteDeployPermission: false,
    CommitMessageActions: [
        {
            words: [
                "NO_DEPLOY",
                "SKIP_DEPLOY",
                "DEPLOY_BLOCKED",
                "DEPLOY_DISABLED",
                "STOP_DEPLOY",
                "README",
                "No Deploy",
                "no deploy"
            ],
            description:
                "Block Deployment if these words are found in the commit message.",
            bypassRepositoryAuthorization: false,
            action: "block"
        },
        {
            words: [
                "REMOTE_BYPASS",
                "BYPASS_DEPLOY",
                "DEPLOY_BYPASS",
                "ALLOW_DEPLOY",
                "DEPLOY_ALLOWED",
                "REMOTE_AUTHORIZED",
                "FIX",
                "fix"
            ],
            description:
                "Bypass Repository Authorization if these words are found in the commit message.",
            bypassRepositoryAuthorization: true,
            action: "allow"
        }
    ]
};

function getFileContent(url: string): Promise<any> {
    return fetch(url).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    });
}

function getDeploymentState(): Promise<any> {
    return getFileContent(Constants.RemoteFile);
}

async function isDeployBlockedByRepository(): Promise<boolean> {
    try {
        const data = await getDeploymentState();

        // @ Debug
        // const State = await Promise.resolve(false);
        const State = data?.File["CI/CD_Pipeline"].Release;

        if (State === false) {
            console.log("🚫 Deployment blocked by remote settings.");
            return true;
        }

        console.log("✅ Deployment Authorized By Remote Settings.");
    } catch (error) {
        console.error("⚠️ Error fetching repository state:", error);
        return false;
    }

    return false;
}

async function isDeployBlockedByCommitMessage(
    commitMessage: string
): Promise<boolean> {
    for (const action of DeploymentCheckState.CommitMessageActions) {
        if (action.action === "block") {
            for (const word of action.words) {
                if (commitMessage.includes(word)) {
                    console.log(
                        `🚫 Deployment blocked by commit message containing "${word}".`
                    );
                    return true;
                }
            }
        } else if (action.action === "allow") {
            for (const word of action.words) {
                if (commitMessage.includes(word)) {
                    console.log(
                        `✅ Deployment allowed by commit message containing "${word}".`
                    );
                    console.log(`💫 Checking for Bypass Authrizations...`);

                    if (action.bypassRepositoryAuthorization === true) {
                        console.log(
                            "🔓 Bypassing Remote Authorization due to Commit Message."
                        );
                        return false;
                    } else {
                        return !DeploymentCheckState.RemoteDeployPermission;
                    }
                }
            }
        }
    }

    return false;
}

(async function main() {
    // @ Debug
    // const commitMessage = "I am a commit message no deploy";
    const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();

    const branch = execSync("git rev-parse --abbrev-ref HEAD")
        .toString()
        .trim();
    console.log(`📝 Commit Message: "${commitMessage}"`);
    console.log(`🌿 Branch: ${branch}`);
    DeploymentCheckState.CommitMessage = commitMessage;

    console.log("💫 Checking for Remote Authorizations.");
    if (!(await isDeployBlockedByRepository())) {
        DeploymentCheckState.RemoteDeployPermission = true;
    }

    console.log("🔍 Checking Deployment Conditions on Commit Message..");
    if (await isDeployBlockedByCommitMessage(commitMessage)) {
        if (DeploymentCheckState.RemoteDeployPermission) {
            console.log(
                "🚫 Deployment blocked by Commit Message despite Remote Authorization."
            );
        }

        console.log("❌ Vercel does not have permission to deploy this Commit");
        process.exit(0);
    }

    console.log("✅ Vercel has now permission to deploy this Commit");
    process.exit(1);
})();
