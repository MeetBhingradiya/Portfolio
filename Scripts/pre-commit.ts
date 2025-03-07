import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk"; // Import Chalk for colors

// 🕒 Generate timestamp
const getTimestamp = (): string => {
    return new Date().toISOString().replace("T", " ").split(".")[0];
};

// 📂 Log file path
const logFile = path.join(process.cwd(), "pre-commit.log");

// 🔄 Reset log file at the start
fs.writeFileSync(logFile, "");

// 📌 Beautify & save logs
const logOutput = (prefix: string, message: string, type: "INFO" | "WARN" | "ERROR" = "INFO") => {
    const timestamp = getTimestamp();
    const formattedLog = `[${timestamp}] [${prefix}] [${type}] ${message.trim()}`;

    // 🎨 Add colors for console output (but keep logs clean in the file)
    let coloredLog;
    switch (type) {
        case "ERROR":
            coloredLog = chalk.red.bold(formattedLog); // 🔴 Red for errors
            break;
        case "WARN":
            coloredLog = chalk.yellow.bold(formattedLog); // 🟡 Yellow for warnings
            break;
        default:
            coloredLog = chalk.green(formattedLog); // ✅ Green for normal logs
    }

    console.log(coloredLog);
    fs.appendFileSync(logFile, formattedLog + "\n");
};

// 📜 Function to execute shell commands & log output
const runCommand = (cmd: string, prefix: string): void => {
    try {
        logOutput(prefix, `Running: ${cmd}...`, "INFO");
        execSync(cmd, { stdio: "inherit" }); // Inherit stdio to preserve colors
        logOutput(prefix, "✅ Command completed successfully!", "INFO");
    } catch (error) {
        logOutput(prefix, `❌ Command failed: ${cmd}`, "ERROR");
        process.exit(1);
    }
};

// 🚀 Main function to run commands in order
const runPreCommit = async () => {
    try {
        runCommand("bun comments", "COMMENTS");

        // 🏗️ Check if build is needed
        if (!fs.existsSync("./dist")) {
            logOutput("BUILD", "🔨 No build found, running build...", "WARN");
            runCommand("bun run build", "BUILD");
        } else {
            logOutput("BUILD", "✅ Build already exists, skipping...", "INFO");
        }

        logOutput("HOOK", "✅ Pre-commit hook completed successfully!", "INFO");
        process.exit(0);
    } catch (error) {
        logOutput("HOOK", (error as Error).message, "ERROR");
        process.exit(1);
    }
};

// 🔥 Start the script
runPreCommit();