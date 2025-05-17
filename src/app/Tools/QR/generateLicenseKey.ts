import * as crypto from 'crypto';

enum LicensingModel {
    Perpetual = "perpetual",
    Subscription = "subscription"
}

function generateLicenseKey(
    scope: string,
    licensingModel: string,
    organization: string,
    expire: number,
    domain: string,
    currentTimestamp: number = Math.floor(Date.now() / 1000)
): string {
    const expiryTimestamp = currentTimestamp + expire * 60 * 60;
    const licenseData = `V=1,S=${scope},L=${licensingModel},O=${organization},E=${expiryTimestamp},D=${domain}`;
    const encodedData = Buffer.from(licenseData).toString("base64");
    const hashPart = crypto.createHash("md5").update(encodedData).digest("hex");
    const licenseKey = `${hashPart}${encodedData}`;
    return licenseKey;
}


export { LicensingModel, generateLicenseKey };