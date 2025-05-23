import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({
    path: "./.env.production",
});

const SECRET_KEY = process.env.STATE_SIGN || "SECRET_KEY";

// Function to generate HMAC signature
function generateHMACSignature(jsonData: any) {
    const clonedData = JSON.parse(JSON.stringify(jsonData));
    const minify = JSON.stringify(clonedData);
    return crypto.createHmac("sha256", SECRET_KEY).update(minify).digest("hex");
}

// Function to fetch remote state
async function fetchRemoteState() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/MeetBhingradiya/Portfolio-RemoteState/refs/heads/Release/State.json');
        if (!response.ok) throw new Error('Failed to fetch remote state');
        return await response.json();
    } catch (error) {
        console.error('❌ Error fetching remote state:', error);
        process.exit(1);
    }
}

// Function to compare file properties
function compareFileProperties(localState: any, remoteState: any) {
    const localFile = JSON.stringify(localState);
    const remoteFile = JSON.stringify(remoteState);
    return localFile === remoteFile;
}

// Function to clone repo and update state
async function updateRemoteState() {
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
        // Clone the repo
        execSync(`git clone https://github.com/MeetBhingradiya/Portfolio-RemoteState.git ${tempDir}`, { stdio: 'inherit' });
        
        // Checkout release branch
        process.chdir(tempDir);
        execSync('git checkout Release', { stdio: 'inherit' });
        
        // Read local state
        const localState = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'State.json'), 'utf-8'));
        
        // Update state file in temp repo
        fs.writeFileSync('State.json', JSON.stringify(localState, null, 4));
        
        // Commit and push changes
        execSync('git add State.json', { stdio: 'inherit' });
        execSync('git commit -m "Updated StateFile By CI/CD Pipeline"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        
        // Clean up
        process.chdir('..');
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        console.log('✅ Successfully updated remote state');
    } catch (error) {
        console.error('❌ Error updating remote state:', error);
        process.exit(1);
    }
}

async function main() {
    try {
        // Read local state
        const localState = JSON.parse(fs.readFileSync('./State.json', 'utf-8'));
        
        // Fetch remote state
        const remoteState = await fetchRemoteState();
        
        // Compare file properties
        const hasNoChanges = compareFileProperties(localState?.File, remoteState?.File);
        
        if (hasNoChanges) {
            console.log('✅ State File is Up to Date');
            return;
        }
        
        // Update local file signature
        localState.Signature = generateHMACSignature(localState.File);
        fs.writeFileSync('./State.json', JSON.stringify(localState, null, 4));
        
        // Update remote state
        await updateRemoteState();
        
    } catch (error) {
        console.error('❌ Error in main process:', error);
        process.exit(1);
    }
}

// Run the script
main();