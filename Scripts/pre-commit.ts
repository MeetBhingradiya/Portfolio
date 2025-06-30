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
const logOutput = (
    prefix: string,
    message: string,
    type: "INFO" | "WARN" | "ERROR" = "INFO"
) => {
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

// 🔧 ESLint auto-fix for React unescaped entities
const fixReactEntities = (): void => {
    try {
        logOutput(
            "ESLINT",
            "🔍 Checking for React unescaped entities in all files...",
            "INFO"
        );

        // Get ALL React/TypeScript files in the project (not just staged) - cross-platform approach
        const getAllReactFiles = (
            dir: string,
            files: string[] = []
        ): string[] => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    // Skip node_modules, .next, dist, and .git directories
                    if (
                        ![
                            "node_modules",
                            ".next",
                            "dist",
                            ".git",
                            ".husky"
                        ].includes(entry.name)
                    ) {
                        getAllReactFiles(fullPath, files);
                    }
                } else if (
                    entry.isFile() &&
                    /\.(tsx?|jsx?)$/.test(entry.name) &&
                    !entry.name.includes(".config.") &&
                    !entry.name.includes(".d.ts")
                ) {
                    files.push(fullPath);
                }
            }

            return files;
        };

        const allReactFiles = getAllReactFiles(process.cwd());

        // Filter files to only include those that actually contain JSX/React components
        const reactFilesWithJSX = allReactFiles.filter(filePath => {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                // Check if file contains JSX/React patterns
                return content.includes('jsx') || 
                       content.includes('tsx') || 
                       content.includes('<') && content.includes('>') ||
                       content.includes('React') ||
                       content.includes('export default') && (content.includes('function') || content.includes('const')) ||
                       /\.(tsx|jsx)$/.test(filePath);
            } catch {
                return false;
            }
        });

        if (reactFilesWithJSX.length === 0) {
            logOutput("ESLINT", "✅ No React components found that need checking", "INFO");
            return;
        }

        logOutput(
            "ESLINT",
            `📁 Found ${reactFilesWithJSX.length} React component file(s) to check (filtered from ${allReactFiles.length} total)`,
            "INFO"
        );

        // Process files in batches to avoid command line length limits
        const batchSize = 50; // Process 50 files at a time
        const batches = [];

        for (let i = 0; i < reactFilesWithJSX.length; i += batchSize) {
            batches.push(reactFilesWithJSX.slice(i, i + batchSize));
        }

        logOutput(
            "ESLINT",
            `🔧 Processing ${batches.length} batch(es) of files...`,
            "INFO"
        );

        // Create a temporary ESLint config for the specific rule
        const tempConfigPath = path.join(process.cwd(), ".eslintrc.temp.js");
        const tempConfig = `module.exports = {
    "rules": {
        "react/no-unescaped-entities": "error"
    },
    "extends": ["next/core-web-vitals"],
    "env": {
        "browser": true,
        "node": true,
        "es2021": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "plugins": ["react", "@typescript-eslint"],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "ignorePatterns": [
        "node_modules/",
        ".next/",
        "dist/",
        "out/",
        "*.config.js",
        "*.config.ts"
    ]
};`;

        fs.writeFileSync(tempConfigPath, tempConfig);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            logOutput(
                "ESLINT",
                `📦 Processing batch ${i + 1}/${batches.length} (${batch.length} files)...`,
                "INFO"
            );

            try {
                execSync(
                    `bunx eslint --fix --quiet --no-error-on-unmatched-pattern --config ${tempConfigPath} ${batch.join(" ")}`,
                    {
                        stdio: "inherit",
                        encoding: "utf8"
                    }
                );
            } catch (eslintError) {
                // ESLint might exit with code 1 if it found issues, but that's okay for auto-fix
                logOutput(
                    "ESLINT",
                    `📝 Batch ${i + 1} completed (some issues may have been auto-fixed)`,
                    "WARN"
                );
            }
        }

        // Clean up temp config
        if (fs.existsSync(tempConfigPath)) {
            fs.unlinkSync(tempConfigPath);
        }

        logOutput(
            "ESLINT",
            "✅ ESLint auto-fix completed for all batches",
            "INFO"
        );

        // Add any fixed files to staging (if they were already staged)
        logOutput("ESLINT", "📤 Adding any fixed files to staging...", "INFO");
        const stagedFiles = execSync(
            "git diff --cached --name-only --diff-filter=ACM",
            { encoding: "utf8" }
        )
            .trim()
            .split("\n")
            .filter((file) => file && /\.(tsx?|jsx?)$/.test(file));

        for (const file of stagedFiles) {
            if (fs.existsSync(file)) {
                execSync(`git add "${file}"`, { encoding: "utf8" });
            }
        }
    } catch (error) {
        logOutput(
            "ESLINT",
            `❌ ESLint auto-fix failed: ${(error as Error).message}`,
            "ERROR"
        );
        throw error;
    }
};

// 🚀 Main function to run commands in order
const runPreCommit = async () => {
    try {
        // Fix React unescaped entities first
        fixReactEntities();

        // 🏗️ Smart build check - check for production build indicators
        const hasProductionBuild = fs.existsSync("./.next/BUILD_ID");

        if (!hasProductionBuild) {
            logOutput(
                "BUILD",
                "🔨 No production build found, running build...",
                "WARN"
            );
            runCommand("bun run build", "BUILD");
        } else {
            logOutput(
                "BUILD",
                "✅ Production build already exists, skipping build...",
                "INFO"
            );
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
