import * as crypto from 'crypto';

enum LicensingModel {
    Perpetual = "perpetual",
    Subscription = "subscription"
}

function generateLicenseKey(
    scope: string,
    licensingModel: string,
    organization: string,
    expiryYearsFromNow: number,
    domain: string
): string {
    // Step 1: Calculate the future expiry timestamp
    const expiryTimestamp = Math.floor(Date.now() / 1000) + expiryYearsFromNow * 24 * 60 * 60;

    // Step 2: Create the license data string
    const licenseData = `V=1,S=${scope},L=${licensingModel},O=${organization},E=${expiryTimestamp},D=${domain}`;

    // Step 3: Encode license data to Base64
    const encodedData = Buffer.from(licenseData).toString('base64');

    // Step 4: Generate MD5 hash of the encoded data for the first 32 characters
    const hashPart = crypto.createHash('md5').update(encodedData).digest('hex');

    // Step 5: Combine the hash and the encoded data
    const licenseKey = `${hashPart}${encodedData}`;

    return licenseKey;
}

// @Main Use
const scope = "qr-border-plugin";
const licensingModel: LicensingModel = LicensingModel.Perpetual;
const organization = "SM Network";
const expiryYearsFromNow = 1;
const domain = "example.com";

const licenseKey = generateLicenseKey(scope, licensingModel, organization, expiryYearsFromNow, domain);
console.log("Generated License Key:", licenseKey);