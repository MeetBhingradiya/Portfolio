import path from "path";
import fs from "fs";
import { generateDescription } from "./FilesDescriptions";
import { execSync } from "child_process";
import packageJson from "../package.json"; // Import version from package.json

const WhitelistedExtensions = [".ts", ".tsx", ".js", ".jsx"];
const targetDirectory = "src/";

function getModifiedFiles(): string[] {
    try {
        const output = execSync("git diff --name-only --diff-filter=M")
            .toString()
            .trim();
        return output
            ? output
                  .split("\n")
                  .filter((file) => file.startsWith(targetDirectory))
            : [];
    } catch (error) {
        console.error("⚠️ Error fetching modified files:", error);
        return [];
    }
}

function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

async function generateFileComment(
    FileID: string,
    fileContent: string
): Promise<string> {
    let createdDate = "";
    let modifiedDate = `@modified ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;
    let fileDescription = await generateDescription(FileID, fileContent);

    const trimmedFileID = FileID.replace(/^src[\\/]/, "").replace(/\\/g, "/");

    const createdRegex =
        /@created (\d{2}\/\d{2}\/\d{2} \d{1,2}:\d{2} (AM|PM) [A-Za-z]+ (\([A-Za-z\s\+:\d]+\))?)/;
    const createdMatch = fileContent.match(createdRegex);
    if (createdMatch) {
        createdDate = `@created ${createdMatch[1]}`;
    } else {
        createdDate = `@created ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;
    }

    return `/**
 *  @FileID          ${trimmedFileID}
 *  @Description     ${fileDescription}
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - ${new Date().getFullYear()} Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: ${packageJson.version}
 *  -----------------------------------------------------------------------------  
 *  ${createdDate}
 *  ${modifiedDate}
 */\n`;
}

/**
 * Process a single modified file
 */
async function processFile(filePath: string): Promise<void> {
    if (!WhitelistedExtensions.includes(path.extname(filePath))) return;

    console.log(`[File Licensing] Processing modified file: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const comment = await generateFileComment(filePath, fileContent);

    try {
        let updatedContent: string;
        if (fileContent.startsWith("/**")) {
            const closingIndex = fileContent.indexOf("*/") + 2;
            const contentAfterComment = fileContent
                .slice(closingIndex)
                .trimStart();
            updatedContent = `${comment}\n${contentAfterComment}`;
        } else {
            updatedContent = `${comment}\n${fileContent}`;
        }

        fs.writeFileSync(filePath, updatedContent, "utf-8");
    } catch (error) {
        console.error(
            `❌ Failed to process ${filePath}:`,
            (error as Error).message
        );
    }
}

/**
 * Process only modified files inside `src` folder
 */
async function processModifiedFiles() {
    console.time(`[File Licensing] Execution Time`);

    const modifiedFiles = getModifiedFiles();
    if (modifiedFiles.length === 0) {
        console.log("✅ No modified files in src/ to process.");
        return;
    }

    for (const file of modifiedFiles) {
        await processFile(file);
    }

    console.timeEnd(`[File Licensing] Execution Time`);
}

processModifiedFiles();
