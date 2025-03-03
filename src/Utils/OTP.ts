/**
 *  @FileID          Utils/OTP.ts
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
 *  @created 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


import { v4 } from "uuid";

function OTP({
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
    OTP
}