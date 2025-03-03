/**
 *  @FileID          Utils\OTP.ts
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
 *  @created 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 */


import { v4 } from "uuid";

/**
 * Generates a one-time password (OTP) based on a set of customizable options.
 *
 * The OTP is composed by first building a pool of characters according to the specified flags:
 * digits, uppercase letters, lowercase letters, and/or special characters. Special character handling
 * can be fine-tuned by excluding or explicitly including certain characters. Additionally, a portion
 * of the OTP may be derived from a generated UUID, with the counted characters deducted from the total length.
 *
 * @param options - Configuration for OTP generation:
 *   - Length: Total length of the OTP (default is 6). When UUIDChars is provided, these characters are generated
 *     from a UUID and deducted from this length.
 *   - Digits: Include numeric digits (0-9) (default is true).
 *   - Uppercase: Include uppercase letters (A-Z) (default is false).
 *   - Lowercase: Include lowercase letters (a-z) (default is false).
 *   - Special: Include a default set of special characters (default is false).
 *   - UUIDChars: Number of characters to extract from a hyphen-less UUID (default is 0).
 *   - ExcludeSpecialChars: Array of special characters to exclude from the default set.
 *   - IncludeSpecialChars: Array of special characters to include; if provided, this may override the default set.
 *   - IncludeSpecialCharsOnly: If true, only the provided special characters (or the default set, if none are provided)
 *     are used for OTP generation, ignoring other character types (default is false).
 *   - ExcludeSpecialCharsOnly: If true, the excluded special characters are removed from the overall character pool (default is false).
 *
 * @returns The generated OTP as a string.
 */
function OTP_Generate({
    Length = 6,
    Digits = true,
    Uppercase = false,
    Lowercase = false,
    Special = false,
    UUIDChars = 0,
    ExcludeSpecialChars = [],
    IncludeSpecialChars = [],
    IncludeSpecialCharsOnly = false,
    ExcludeSpecialCharsOnly = false
}: {
    Length?: number,
    Digits?: boolean,
    Uppercase?: boolean,
    Lowercase?: boolean,
    Special?: boolean,
    UUIDChars?: number,
    ExcludeSpecialChars?: string[],
    IncludeSpecialChars?: string[],
    IncludeSpecialCharsOnly?: boolean,
    ExcludeSpecialCharsOnly?: boolean
}) {
    let Characters = '';

    if (IncludeSpecialCharsOnly) {
        // If only special characters should be included, ignore other character types
        Characters = IncludeSpecialChars.length ? IncludeSpecialChars.join('') : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    } else {
        if (Digits) Characters += '0123456789';
        if (Uppercase) Characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (Lowercase) Characters += 'abcdefghijklmnopqrstuvwxyz';
        if (Special) {
            let specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            // If ExcludeSpecialChars is set, remove them
            if (ExcludeSpecialChars.length) {
                specialChars = specialChars.split('').filter(char => !ExcludeSpecialChars.includes(char)).join('');
            }
            
            // If IncludeSpecialChars is set, use only the specified characters
            if (IncludeSpecialChars.length) {
                specialChars = IncludeSpecialChars.join('');
            }

            Characters += specialChars;
        }
    }

    // If only excluded special characters should be removed, reset characters to exclude them only
    if (ExcludeSpecialCharsOnly) {
        Characters = Characters.split('').filter(char => !ExcludeSpecialChars.includes(char)).join('');
    }

    let OTP = '';

    // Generate UUID-based characters if requested
    if (UUIDChars > 0) {
        const uuid = v4().replace(/-/g, '');
        for (let i = 0; i < UUIDChars; i++) {
            OTP += uuid.charAt(Math.floor(Math.random() * uuid.length));
        }
        Length -= UUIDChars;
    }

    // Generate OTP with filtered characters
    for (let i = 0; i < Length; i++) {
        OTP += Characters.charAt(Math.floor(Math.random() * Characters.length));
    }

    return OTP;
}

export {
    OTP_Generate
}