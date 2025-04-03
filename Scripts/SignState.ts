import crypto from "crypto";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
    path: "./.env.local",
});

// ? Store JSON Data into Variable so we can use it in the function
const State = JSON.parse(fs.readFileSync("./State.json", "utf-8"));

const SECRET_KEY = process.env.STATE_SIGN || "SECRET_KEY";

function generateHMACSignature(jsonData: any, SecretKey: string = SECRET_KEY) {
    const clonedData = JSON.parse(JSON.stringify(jsonData));
    const Minify = JSON.stringify(clonedData);
    return crypto.createHmac("sha256", SecretKey).update(Minify).digest("hex");
}

// ? Write the Signature to the JSON File
State.Signature = generateHMACSignature(State.File);

fs.writeFileSync("./State.json", JSON.stringify(State, null, 4));

// async function verifySignature(jsonData: any) {
//     const originalSignature = jsonData.Signature;
//     if (!originalSignature) {
//         console.log("❌ No signature found in the JSON.");
//         return false;
//     }

//     if (!jsonData.File) {
//         console.log("❌ No file data found in the JSON.");
//         return false;
//     }

//     const calculatedSignature = generateHMACSignature(jsonData.File);

//     if (calculatedSignature === originalSignature) {
//         console.log("✅ Signature is valid!");
//         return true;
//     } else {
//         console.log("❌ Signature mismatch!");
//         return false;
//     }
// }

async function HMACSignature(SecretKey: string = SECRET_KEY) {
    const generateSignature = (jsonData: any) => {
        const clonedData = JSON.parse(JSON.stringify(jsonData));
        const Minify = JSON.stringify(clonedData);
        return crypto.createHmac("sha256", SecretKey).update(Minify).digest("hex");
    }

    const verifySignature = (jsonData: {
        Signature: string;
        Data: any;
    }, URL?: string) => {

        const originalSignature = jsonData.Signature;
        if (!originalSignature) {
            console.error("❌ No \"Signature\" found in the JSON.");
            return false;
        }

        if (!jsonData.Data) {
            console.error("❌ No \"Data\" found in the JSON.");
            return false;
        }

        const calculatedSignature = generateSignature(jsonData.Data);

        if (calculatedSignature === originalSignature) {
            console.log("✅ Signature is valid!");
            return true;
        } else {
            console.error("❌ Signature mismatch!");
            return false;
        }
    }
    
    const verifySignatureFromUrl = async (url:string) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

            const jsonData = await response.json();
            return verifySignature(jsonData);
        } catch (error) {
            console.error("❌ Verification Failed", error);
            return false;
        }
    };

    return {
        generateSignature,
        verifySignature,
        verifySignatureFromUrl
    };
}

// Function to fetch JSON from a GitHub Gist and verify the signature
async function verifySignatureFromGist(gistUrl: string) {
    try {
        // Fetch the raw JSON file
        const response = await fetch(gistUrl);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);

        const jsonData = await response.json();

        // Extract original signature
        const originalSignature = jsonData.Signature;
        if (!originalSignature) {
            console.log("❌ No signature found in the JSON.");
            return false;
        }

        // Recalculate signature
        const calculatedSignature = generateHMACSignature(jsonData.File);

        // Compare signatures
        if (calculatedSignature === originalSignature) {
            console.log("✅ Signature is valid!");
            return true;
        } else {
            console.log("❌ Signature mismatch!");
            return false;
        }
    } catch (error) {
        console.error("❌ Verification Failed");
        return false;
    }
}

// const gistRawUrl = "https://gist.githubusercontent.com/MeetBhingradiya/8029e188041205ae8198d8c1cb8907ad/raw/State.json";

// Run verification
// verifySignatureFromGist(gistRawUrl);

// Generate Signature
console.log("Signature:", generateHMACSignature(State.File));