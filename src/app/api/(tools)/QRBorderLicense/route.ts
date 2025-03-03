/**
 *  @FileID          app\api\(tools)\QRBorderLicense\route.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import axios from 'axios';

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

export async function GET() {

    return NextResponse.json(generateLicenseKey(
        "qr-code-styling",
        LicensingModel.Perpetual,
        "organization",
        1,
        "*.vercel.app"
    ));
}
