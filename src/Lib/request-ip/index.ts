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