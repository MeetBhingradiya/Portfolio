/**
 *  @FileID          Lib/request-ip/index.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

import { NextRequest } from "next/server";
import { is } from "./is";

function getClientIpFromXForwardedFor(value: any) {
    if (!is.existy(value)) {
        return null;
    }

    if (typeof value !== 'string') {
        throw new TypeError("Expected a string, got \"".concat(typeof value, "\""));
    }


    // ? By CodeRabbit Suggestions
    var forwardedIps = value.split(',').map(e => e.trim());

    forwardedIps = forwardedIps.map(ip => {
        const ipv4PortMatch = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/);
        if (ipv4PortMatch) {
            return ipv4PortMatch[1];
        }
        return ip;
    });

    for (var i = 0; i < forwardedIps.length; i++) {
        if (is.ip(forwardedIps[i])) {
            return forwardedIps[i];
        }
    }

    return null;
}

function getClientIp(req: NextRequest): string | string[] | null | undefined {
    if (req.headers) {
        if (is.ip(req.headers.get('x-client-ip'))) {
            return req.headers.get('x-client-ip');
        }

        var xForwardedFor = getClientIpFromXForwardedFor(req.headers.get('x-forwarded-for'));

        if (is.ip(xForwardedFor)) {
            return xForwardedFor;
        }

        const FindHeaders = [
            'fastly-client-ip',
            'true-client-ip',
            'x-real-ip',
            'x-cluster-client-ip',
            'x-forwarded',
            'forwarded-for',
            'forwarded',
            'x-appengine-user-ip'
        ]

        for (const header of FindHeaders) {
            const headerValue = req.headers.get(header);
            if (is.ip(headerValue)) {
                return headerValue;
            }
        }
    }

    return null;
}

export { getClientIp };