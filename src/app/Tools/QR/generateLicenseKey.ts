/**
 *  @file        app\Tools\QR\generateLicenseKey.ts
 *  @description No description available for app\Tools\QR\generateLicenseKey.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
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