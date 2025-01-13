import { generateDescription } from './FilesDescriptions';
import { execSync } from 'child_process';
import fs from "fs";

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

function generateFileComment(filename: string, filePath: string): string {

    let createdDate = '';
    let modifiedDate = formatDate(new Date());

    const fileContent = fs.readFileSync(filePath, 'utf-8');

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
 *  @file        ${filename}
 *  @description ${generateDescription(filename)}
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) ${new Date().getFullYear()} Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  ${createdDate}
 *  ${modifiedDate}
 */\n`;
}

export {
    generateFileComment
}