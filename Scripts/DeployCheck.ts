// ? Get Latest Commit Message

import { execSync } from "child_process";

const commitMessage = execSync("git log -1 --pretty=%B").toString().trim();

// ? if Includes "NO_DEPLOY" in the commit message, then exit the process with code 1
if (commitMessage.includes("NO_DEPLOY")) {
    process.exit(1);
}

// ? if not, then exit the process with code 0
process.exit(0);