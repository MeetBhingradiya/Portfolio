/**
 *  @FileID          Lib/request-ip/is.ts
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
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
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
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


var regexes = {
    ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
    ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
};

function not<T extends (...args: any[]) => boolean>(func: T): (...args: Parameters<T>) => boolean {
    return function () {
        return !func.apply(null, Array.prototype.slice.call(arguments));
    };
}

function existy(value: any) {
    return value !== null;
}

function ip(value: string | null): boolean {

    if (value !== null && typeof value === 'string') {
        return regexes.ipv4.test(value) || regexes.ipv6.test(value);
    }

    return false
}

function object(value: any) {
    return Object(value) === value;
}

function string(value: any) {
    return Object.prototype.toString.call(value) === '[object String]';
}

var is = {
    existy: existy,
    ip: ip,
    object: object,
    string: string,
    not: {
        existy: not(existy),
        ip: not(ip),
        object: not(object),
        string: not(string)
    }
};

export { is };