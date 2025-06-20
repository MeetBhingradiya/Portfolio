import crypto from "crypto";
import { Config } from "@Config";

const SECRET_KEY = Config.Env.STATE_SIGNATURE || "STATE_SIGNATURE";

/**
 * HMACSignature module for generating and verifying HMAC SHA-256 signatures.
 * @param {string} SecretKey - The secret key used for hashing (default: "SECRET_KEY").
 */
function HMACSignature(SecretKey: string = SECRET_KEY) {
    /**
     * Generates an HMAC SHA-256 signature for the given JSON data.
     * @param {any} jsonData - The data to be signed.
     * @returns {string} - The generated HMAC signature.
     */
    const generateSignature = (jsonData: any): string => {
        const clonedData = JSON.parse(JSON.stringify(jsonData)); // Deep clone the JSON data to avoid mutations.
        const Minify = JSON.stringify(clonedData); // Convert JSON to a minified string.
        return crypto
            .createHmac("sha256", SecretKey)
            .update(Minify)
            .digest("hex");
    };

    /**
     * Verifies the integrity of the JSON data using HMAC SHA-256.
     * @param {object} jsonData - The JSON object containing "Signature" and "Data" properties.
     * @returns {boolean} - Returns true if the signature is valid, otherwise false.
     */
    const verifySignature = (jsonData: {
        Signature: string;
        Data: any;
    }): boolean => {
        const originalSignature = jsonData.Signature;
        if (!originalSignature) {
            console.error('❌ No "Signature" found in the JSON.');
            return false;
        }

        if (!jsonData.Data) {
            console.error('❌ No "Data" found in the JSON.');
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
    };

    /**
     * Fetches JSON data from a given URL and verifies its signature.
     * @param {string} url - The URL of the JSON data.
     * @returns {Promise<boolean>} - Resolves to true if the signature is valid, otherwise false.
     */
    const verifySignatureFromUrl = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }

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

export { HMACSignature };
