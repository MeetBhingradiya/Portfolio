/**
 *  @FileID          Lib\request-ip\index.ts
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
 *  @created 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
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

    var forwardedIps = value.split(',').map(function (e: any) {
        var ip = e.trim();

        if (ip.includes(':')) {
            var splitted = ip.split(':');

            if (splitted.length === 2) {
                return splitted[0];
            }
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
        if(is.ip(req.headers.get('x-client-ip'))){
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

        FindHeaders.forEach((header) => {
            if(is.ip(req.headers.get(header))){
                return req.headers.get(header);
            }
        })
    }

    return null;
}

export { getClientIp };