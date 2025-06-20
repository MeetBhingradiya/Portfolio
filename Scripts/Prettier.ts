import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import chalk from "chalk";

// File extensions to format
const SUPPORTED_EXTENSIONS = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".css",
    ".scss",
    ".sass",
    ".html",
    ".vue",
    ".md",
    ".mdx",
    ".yaml",
    ".yml"
];

// Directories to exclude from formatting
const EXCLUDED_DIRS = [
    "node_modules",
    ".next",
    "dist",
    "build",
    ".git",
    "coverage",
    ".nyc_output",
    "public/assets"
];

// Files to exclude from formatting
const EXCLUDED_FILES = [
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",
    "pnpm-lock.yaml"
];

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip excluded directories
            if (!EXCLUDED_DIRS.includes(file)) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            // Include only supported extensions and exclude specific files
            const ext = path.extname(file);
            if (
                SUPPORTED_EXTENSIONS.includes(ext) &&
                !EXCLUDED_FILES.includes(file)
            ) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

/**
 * Format a single file with Prettier
 */
function formatFile(filePath: string): boolean {
    try {
        console.log(
            chalk.blue(
                `📝 Formatting: ${path.relative(process.cwd(), filePath)}`
            )
        );
        execSync(`npx prettier --write "${filePath}"`, { stdio: "pipe" });
        return true;
    } catch (error) {
        console.error(chalk.red(`❌ Failed to format ${filePath}:`), error);
        return false;
    }
}

/**
 * Format files using Prettier with glob patterns
 */
function formatWithGlob(): boolean {
    try {
        console.log(
            chalk.blue("🎨 Running Prettier on all supported files...")
        );

        // Use a comprehensive pattern that should catch all files
        const mainCommand =
            'npx prettier --write "**/*.{ts,tsx,js,jsx,json,css,scss,md,mdx}" --ignore-path .gitignore';

        try {
            execSync(mainCommand, { stdio: "inherit" });
            console.log(
                chalk.green(
                    "✅ Formatted all TypeScript, JavaScript, JSON, CSS, and Markdown files"
                )
            );
        } catch (error) {
            console.log(
                chalk.yellow(
                    "⚠️ Some files may not have been formatted or pattern not found"
                )
            );
        }

        // Also format specific root files
        const rootFiles = [
            "package.json",
            "tsconfig.json",
            "next.config.ts",
            "tailwind.config.ts",
            "prettier.config.ts",
            "eslint.config.mjs",
            "postcss.config.mjs",
            "README.md"
        ];

        for (const file of rootFiles) {
            const fullPath = path.join(process.cwd(), file);
            if (fs.existsSync(fullPath)) {
                try {
                    execSync(`npx prettier --write "${file}"`, {
                        stdio: "pipe"
                    });
                    console.log(chalk.green(`✅ Formatted: ${file}`));
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ Could not format: ${file}`));
                }
            }
        }

        return true;
    } catch (error) {
        console.error(chalk.red("❌ Failed to format files:"), error);
        return false;
    }
}

/**
 * Check if Prettier is installed
 */
function checkPrettierInstallation(): boolean {
    try {
        execSync("npx prettier --version", { stdio: "pipe" });
        return true;
    } catch (error) {
        console.error(
            chalk.red("❌ Prettier is not installed. Please install it first:")
        );
        console.log(chalk.yellow("npm install --save-dev prettier"));
        console.log(chalk.yellow("or"));
        console.log(chalk.yellow("bun add --dev prettier"));
        return false;
    }
}

/**
 * Main formatting function
 */
async function formatCode(): Promise<void> {
    console.log(
        chalk.cyan("🚀 Starting automatic code formatting with Prettier...")
    );
    console.log(chalk.gray("=".repeat(60)));

    // Check if Prettier is installed
    if (!checkPrettierInstallation()) {
        process.exit(1);
    }

    const startTime = Date.now();
    let success = false;

    try {
        // Try glob-based formatting first (faster)
        success = formatWithGlob();

        if (success) {
            console.log(chalk.gray("=".repeat(60)));
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            console.log(
                chalk.green(
                    `✅ Code formatting completed successfully in ${duration}s`
                )
            );
            console.log(
                chalk.green("🎉 All files have been formatted with Prettier!")
            );
        }
    } catch (error) {
        console.error(chalk.red("❌ Error during formatting:"), error);
        process.exit(1);
    }

    // Run ESLint fix if available
    try {
        console.log(chalk.blue("\n🔧 Running ESLint auto-fix..."));
        execSync("npx eslint . --fix --ext .ts,.tsx,.js,.jsx", {
            stdio: "pipe"
        });
        console.log(chalk.green("✅ ESLint auto-fix completed"));
    } catch (error) {
        console.log(
            chalk.yellow(
                "⚠️ ESLint auto-fix skipped (not available or has unfixable issues)"
            )
        );
    }

    console.log(chalk.cyan("\n🎨 Formatting process completed!"));
}

// Run the script
if (require.main === module) {
    formatCode().catch((error) => {
        console.error(chalk.red("❌ Script failed:"), error);
        process.exit(1);
    });
}

export { formatCode, formatFile, getAllFiles };
