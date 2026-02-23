import CryptoJS from "crypto-js";

export enum LicensingModel {
    Perpetual = "perpetual",
    Subscription = "subscription"
}

export function generateLicenseKey(
    scope: string,
    licensingModel: string,
    organization: string,
    expire: number,
    domain: string,
    currentTimestamp: number = Math.floor(Date.now() / 1000)
): string {
    const expiryTimestamp = currentTimestamp + expire * 60 * 60;
    const licenseData = `V=1,S=${scope},L=${licensingModel},O=${organization},E=${expiryTimestamp},D=${domain}`;
    const encodedData = btoa(licenseData);
    const hashPart = CryptoJS.MD5(encodedData).toString();
    return `${hashPart}${encodedData}`;
}
