/**
 * Script to generate SHA-512 hashes for admin signatures
 * Run with: ts-node Scripts/CreateSignatures.ts "your string to hash"
 */

import { createHash } from 'crypto';
import * as readline from 'readline';

function createSHA512Hash(input: string): string {
    return createHash('sha512').update(input).digest('hex');
}

function startInteractiveMode() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log('=== Signature Generator ===');
    console.log('Enter a string to generate its SHA-512 hash (Ctrl+C to exit)');

    function promptUser() {
        rl.question('> ', (input) => {
            if (input.trim().toLowerCase() === 'exit') {
                rl.close();
                return;
            }

            const hash = createSHA512Hash(input);
            console.log('\nInput: ', input);
            console.log('SHA-512 Hash: ', hash);
            console.log('\nYou can use this hash as your ADMIN_SIGNATURE in your .env file');
            console.log('------------------------------------------------------\n');
            promptUser();
        });
    }

    promptUser();
}

function main() {
    const args = process.argv.slice(2);

    if (args.length > 0) {
        const input = args[0];
        const hash = createSHA512Hash(input);

        console.log('Input: ', input);
        console.log('SHA-512 Hash: ', hash);
        console.log('\nYou can use this hash as your ADMIN_SIGNATURE in your .env file');
    } else {
        startInteractiveMode();
    }
}

main(); 