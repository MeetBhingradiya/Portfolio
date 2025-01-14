/**
 *  @FileID          app\Tools\QR\generateLicenseKey.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

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