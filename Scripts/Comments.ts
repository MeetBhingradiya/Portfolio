import path from 'path';
import fs from 'fs';
import { generateDescription } from './FilesDescriptions';
import { execSync } from 'child_process';

let Itrations = 0;
const WhitelistedExtensions = [
    '.ts',
    '.tsx',
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
        execSync(`git diff --quiet ${filePath}`);
        return false;
    } catch (error) {
        return true;
    }
}

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
 *  Copyright (c) 2021 - ${new Date().getFullYear()} Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  ${createdDate}
 *  ${modifiedDate}
 */
\n`
}

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