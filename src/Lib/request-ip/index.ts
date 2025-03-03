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

/**
 * Extracts the first valid client IP address from a comma-separated "X-Forwarded-For" header value.
 *
 * This function verifies that the input is defined and a string. It splits the header value by commas,
 * trims each entry, and for entries containing a colon (indicative of IPv6 formatting), it extracts the segment
 * before the colon if exactly two segments are present. The function then checks each candidate with an IP validation
 * utility and returns the first valid IP address found.
 *
 * @param value - A comma-separated string from the "X-Forwarded-For" header.
 * @returns The first valid IP address, or null if no valid IP is found or if the input does not exist.
 *
 * @throws {TypeError} If the provided value is not a string.
 */
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

/**
 * Retrieves the client's IP address from a Next.js HTTP request by checking multiple headers.
 *
 * The function first examines the "x-client-ip" header and returns its value if it is a valid IP address.
 * If not, it processes the "x-forwarded-for" header using the helper function getClientIpFromXForwardedFor and checks its validity.
 * Finally, it iterates through a predefined list of alternative headers (such as "fastly-client-ip", "true-client-ip", and others)
 * and returns the first valid IP address found. If no valid IP is detected, the function returns null.
 *
 * @param req - The NextRequest object containing HTTP headers.
 * @returns The first valid client IP address found, or null if none is valid.
 */
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