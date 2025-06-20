import path from "path";
import fs from "fs";

const WhitelistedExtensions = [".ts", ".tsx", ".js", ".jsx"];
const targetDirectory = path.resolve("src");

function getAllFiles(dir: string, allFiles: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllFiles(fullPath, allFiles);
        } else if (
            entry.isFile() &&
            WhitelistedExtensions.includes(path.extname(entry.name))
        ) {
            allFiles.push(fullPath);
        }
    }

    return allFiles;
}

async function processFile(filePath: string): Promise<void> {
    console.log(`[File Licensing] Cleaning comment from: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");

    let updatedContent: string;
    if (fileContent.startsWith("/**")) {
        const closingIndex = fileContent.indexOf("*/");
        if (closingIndex !== -1) {
            const contentAfterComment = fileContent
                .slice(closingIndex + 2)
                .trimStart();
            updatedContent = contentAfterComment;
        } else {
            console.warn(`⚠️ Malformed comment block in: ${filePath}`);
            return;
        }
    } else {
        // No comment to remove
        return;
    }

    try {
        fs.writeFileSync(filePath, updatedContent, "utf-8");
    } catch (error) {
        console.error(
            `❌ Failed to update ${filePath}:`,
            (error as Error).message
        );
    }
}

async function processAllFilesInSrc() {
    console.time(`[File Licensing] Execution Time`);

    const allFiles = getAllFiles(targetDirectory);
    if (allFiles.length === 0) {
        console.log("✅ No files found in src/ to clean.");
        return;
    }

    for (const file of allFiles) {
        await processFile(file);
    }

    console.timeEnd(`[File Licensing] Execution Time`);
}

processAllFilesInSrc();
