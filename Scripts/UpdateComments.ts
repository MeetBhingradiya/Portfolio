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
        execSync(`git diff --name-only --quiet ${filePath}`, { encoding: 'utf-8' });
        return false;
    } catch (error) {
        return true;
    }
}

async function generateFileComment(filename: string, filePath: string, fileContent: string): Promise<string> {

    let createdDate = '';
    let modifiedDate = formatDate(new Date());

    const createdRegex = /@created (\d{2}\/\d{2}\/\d{2} \d{2}:\d{2} (AM|PM))/;
    const modifiedRegex = /@modified (\d{2}\/\d{2}\/\d{2} \d{2}:\d{2} (AM|PM))/;

    const createdMatch = fileContent.match(createdRegex);
    if (createdMatch) {
        createdDate = `@created ${createdMatch[1]} IST (Kolkata +5:30 UTC)`;
    } else {
        createdDate = `@created ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;
    }

    const modifiedMatch = fileContent.match(modifiedRegex);
    const FileModified = isFileModified(filePath)
    if (modifiedMatch && FileModified) {
        modifiedDate = `@modified ${formatDate(new Date())} IST (Kolkata +5:30 UTC)`;
    } else if (modifiedMatch) {
        modifiedDate = `@modified ${modifiedMatch[1]} IST (Kolkata +5:30 UTC)`;
    }


    if (!modifiedMatch) {
        modifiedDate = `@modified ${modifiedDate} IST (Kolkata +5:30 UTC)`;
    }


    return `/**
 *  @FileID          ${filename}
 *  @Description     ${generateDescription(filename)}
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) ${new Date().getFullYear()} Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  ${createdDate}
 *  ${modifiedDate}
 */\n`;
}

async function processFile(filePath: string): Promise<void> {
    const filename = path.relative('src', filePath);
    const File = fs.readFileSync(filePath, 'utf-8');
    const comment = await generateFileComment(filename, filePath, File);

    try {
        let updatedContent: string;
        if (File.startsWith('/**')) {
            const closingIndex = File.indexOf('*/') + 2;
            const contentAfterComment = File.slice(closingIndex).trimStart();
            updatedContent = `${comment}\n${contentAfterComment}`;
        } else {
            updatedContent = `${comment}\n${File}`;
        }

        await fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`[File Licensing] Processed file: ${filePath}`);
    } catch (error) {
        console.error(`Failed to process ${filePath}:`, (error as Error).message);
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
    console.log(`[File Licensing] Processed directory: ${directory}`);
}

const targetDirectory: string = "src";

processDirectory(targetDirectory);