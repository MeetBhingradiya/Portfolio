import { NextRequest } from "next/server";
import * as http from "http";
import { is } from "./is";

interface RequestHeaders extends http.IncomingHttpHeaders {
    "x-client-ip"?: string | undefined;
    "x-forwarded-for"?: string | undefined;
    "x-real-ip"?: string | undefined;
    "x-cluster-client-ip"?: string | undefined;
    "x-forwarded"?: string | undefined;
    "forwarded-for"?: string | undefined;
    "forwarded"?: string | undefined;
}

interface Request {
    headers?: RequestHeaders;
    connection?: {
        remoteAddress?: string | undefined;
        socket?: {
            remoteAddress?: string | undefined;
        } | undefined;
    } | undefined;
    info?: {
        remoteAddress?: string | undefined;
    } | undefined;
    socket?: {
        remoteAddress?: string | undefined;
    } | undefined;
}

interface Options {
    attributeName: string;
}


function getClientIpFromXForwardedFor(value: any) {
    if (!is.existy(value)) {
        return null;
    }

    if (is.not.string(value)) {
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
        if (is.ip(req.headers.get['x-client-ip'])) {
            return req.headers['x-client-ip'];
        }

        var xForwardedFor = getClientIpFromXForwardedFor(req.headers['x-forwarded-for']);

        if (is.ip(xForwardedFor)) {
            return xForwardedFor;
        }

        if (is.ip(req.headers['cf-connecting-ip'])) {
            return req.headers['cf-connecting-ip'];
        }

        if (is.ip(req.headers['fastly-client-ip'])) {
            return req.headers['fastly-client-ip'];
        }

        if (is.ip(req.headers['true-client-ip'])) {
            return req.headers['true-client-ip'];
        }

        if (is.ip(req.headers['x-real-ip'])) {
            return req.headers['x-real-ip'];
        }

        if (is.ip(req.headers['x-cluster-client-ip'])) {
            return req.headers['x-cluster-client-ip'];
        }

        if (is.ip(req.headers['x-forwarded'])) {
            return req.headers['x-forwarded'];
        }

        if (is.ip(req.headers['forwarded-for'])) {
            return req.headers['forwarded-for'];
        }

        if (is.ip(req.headers.forwarded)) {
            return req.headers.forwarded;
        }

        if (is.ip(req.headers['x-appengine-user-ip'])) {
            return req.headers['x-appengine-user-ip'];
        }
    }

    return null;
}