/**
 *  @FileID          Lib\request-ip\is.ts
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


var regexes = {
    ipv4: /^(?:(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])\.){3}(?:\d|[1-9]\d|1\d{2}|2[0-4]\d|25[0-5])$/,
    ipv6: /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
};

/**
 * Creates a new function that returns the boolean negation of the result from the provided function.
 *
 * When the returned function is invoked, it applies all its received arguments to the original function
 * and negates its return value. This is useful for generating functions that check for the opposite condition
 * of the original function.
 *
 * @param func - The function whose returned value will be inverted.
 * @returns A function that returns false when the original function returns a truthy value, and true otherwise.
 */
function not(func: Function) {
    return function () {
        return !func.apply(null, Array.prototype.slice.call(arguments));
    };
}

/**
 * Checks whether the provided value is not null.
 *
 * @param value - The value to evaluate.
 * @returns True if the value is not null, otherwise false.
 */
function existy(value: any) {
    return value !== null;
}

/**
 * Validates if the input is a valid IP address.
 *
 * This function checks whether the provided value is a non-null string and then tests it against
 * predefined patterns for IPv4 and IPv6 addresses. It returns true if the value matches either format,
 * and false otherwise.
 *
 * @param value - The value to validate as an IP address.
 * @returns True if the input is a valid IPv4 or IPv6 address; otherwise, false.
 */
function ip(value: string | null): boolean {

    if (value !== null && typeof value === 'string') {
        return regexes.ipv4.test(value) || regexes.ipv6.test(value);
    }

    return false
}

/**
 * Determines whether the provided value is an object.
 *
 * This function returns true when the value is a non-primitive object. Primitives and null will result in false.
 *
 * @param value - The value to check.
 * @returns True if the value is an object; otherwise, false.
 */
function object(value: any) {
    return Object(value) === value;
}

/**
 * Checks whether the provided value is a string.
 *
 * This function compares the internal [[Class]] of the value to determine if it is a string.
 *
 * @param value - The value to validate.
 * @returns True if the value is a string; otherwise, false.
 */
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