import path from 'path';
import fs from 'fs';
import { generateDescription } from './FilesDescriptions';
import { execFileSync } from 'child_process';

let Itrations = 0;
const WhitelistedExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
];

function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;

    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

function isFileModified(filePath: string): boolean {
    try {
        execFileSync('git', ['diff', '--quiet', filePath]);
        return false;
    } catch (error) {
        return true;
    }
}

/**
 * Generates a formatted file comment block with licensing, metadata, and timestamp information.
 *
 * This function creates a comment block that includes the file's identifier, a description generated
 * from that identifier, and details about the author and licensing. It extracts an existing creation
 * timestamp from the file content using a regular expression; if not found, it uses the current date with
 * a specified IST timezone. The modification timestamp is also updated to the current date and time.
 *
 * @param FileID - The identifier for the file, used to generate the file description.
 * @param fileContent - The content of the file from which the creation date may be extracted.
 *
 * @returns A promise that resolves to a formatted comment block string.
 */
async function generateFileComment(FileID: string, fileContent: string): Promise<string> {

    let createdDate = '';
    let modifiedDate = formatDate(new Date());

    const createdRegex = /@created (\d{2}\/\d{2}\/\d{2} \d{1,2}:\d{2} (AM|PM) [A-Za-z]+ (\([A-Za-z\s\+:\d]+\))?)/;
    const createdMatch = fileContent.match(createdRegex);
    if (createdMatch) {
        createdDate = `@created ${createdMatch[1]}`;
    } else {
        createdDate = `@created ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;
    }

    modifiedDate = `@modified ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;

    return `/**
 *  @FileID          ${FileID}
 *  @Description     ${generateDescription(FileID)}
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - ${new Date().getFullYear()} Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  ${createdDate}
 *  ${modifiedDate}
 */
\n`
}

/**
 * Processes a file to add or update its licensing comment block.
 *
 * This asynchronous function checks if the file identified by the given path has been modified. If not,
 * the function exits early. Otherwise, it reads the file's content, generates a new licensing comment (including
 * metadata such as file ID and timestamps), and updates the file by replacing an existing comment block or
 * prepending the new comment. Any errors encountered during the file update are logged to the console.
 *
 * @param FilePath - The path of the file to process.
 */
async function processFile(FilePath: string): Promise<void> {
    const FileData = {
        ID: path.relative('src', FilePath),
        isModified: isFileModified(FilePath)
    }

    if (!FileData.isModified) {
        return;
    } else {
        console.log(`[File Licensing] File is begain modified: ${FilePath}`);
    }

    const FileContent = fs.readFileSync(FilePath, 'utf-8');
    const Comment = await generateFileComment(FileData.ID, FileContent)

    try {
        let updatedContent: string;
        if (FileContent.startsWith('/**')) {
            const closingIndex = FileContent.indexOf('*/') + 2;
            const contentAfterComment = FileContent.slice(closingIndex).trimStart();
            updatedContent = `${Comment}\n${contentAfterComment}`;
        } else {
            updatedContent = `${Comment}\n${FileContent}`;
        }

        await fs.writeFileSync(FilePath, updatedContent, 'utf-8');
    } catch (error) {
        console.error(`Failed to process ${FilePath}:`, (error as Error).message);
    }
}

async function processDirectory(directory: string): Promise<void> {
    Itrations++;

    if (directory === targetDirectory) {
        console.time(`[File Licensing] ${Itrations}`);
    }

    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
        const fullPath = path.join(directory, entry);

        if (fs.statSync(fullPath).isDirectory()) {
            await processDirectory(fullPath);
        } else if (WhitelistedExtensions.includes(path.extname(fullPath))) {
            await processFile(fullPath);
        }
    }


    if (directory === targetDirectory) {
        console.timeEnd(`[File Licensing] ${Itrations}`);
    }
}

const targetDirectory: string = "src";

processDirectory(targetDirectory);