import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import axios from 'axios';

enum LicensingModel {
    Perpetual = "perpetual",
    Subscription = "subscription"
}

function generateLicenseKey(
    scope: string,
    licensingModel: LicensingModel,
    organization: string,
    expire: number,
    domain: string
) {
    const expiryTimestamp = Math.floor(Date.now() / 1000) + expire * 60 * 60;
    const licenseData = `V=1,S=${scope},L=${licensingModel},O=${organization},E=${expiryTimestamp},D=${domain}`;
    const encodedData = Buffer.from(licenseData).toString('base64');
    const hashPart = crypto.createHash('md5').update(encodedData).digest('hex');
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
