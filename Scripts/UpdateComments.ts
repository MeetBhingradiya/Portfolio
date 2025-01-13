import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { generateFileComment } from './CommentGeterate';

interface PythonResult {
    status: string;
    file: string;
    error?: string;
}

const WhitelistedExtensions = [
    '.ts',
    '.tsx',
];

function editFileWithPython(filePath: string, comment: string): Promise<PythonResult> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [path.resolve(__dirname, 'IODrivers.py')]);

        const inputData = JSON.stringify({ file_path: filePath, comment });

        pythonProcess.stdin.write(inputData);
        pythonProcess.stdin.end();

        let result = '';
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Error: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(result) as PythonResult);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject(new Error(`Python script exited with code ${code}`));
            }
        });
    });
}

async function processFile(filePath: string): Promise<void> {
    const filename = path.relative('src', filePath);
    const comment = generateFileComment(filename, filePath);

    try {
        await editFileWithPython(filePath, comment);
    } catch (error) {
        console.error(`Failed to process ${filePath}:`, (error as Error).message);
    }
}

async function processDirectory(directory: string): Promise<void> {
    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
        const fullPath = path.join(directory, entry);

        if (fs.statSync(fullPath).isDirectory()) {
            await processDirectory(fullPath);
        } else if (WhitelistedExtensions.includes(path.extname(fullPath))) {
            await processFile(fullPath);
        }
    }

    console.log(`[File Licensing] Processed directory: ${directory}`);
}

const targetDirectory: string = "src";

processDirectory(targetDirectory);