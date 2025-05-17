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