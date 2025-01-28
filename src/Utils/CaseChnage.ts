/**
 *  @FileID          Utils\CaseChnage.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


type CaseTransformer = (input: string) => string;

interface ChangeCaseFunctions {
    camel: CaseTransformer
    constant: CaseTransformer
    dot: CaseTransformer
    kebab: CaseTransformer
    lower: CaseTransformer
    lowerFirst: CaseTransformer
    no: CaseTransformer
    param: CaseTransformer
    pascal: CaseTransformer
    path: CaseTransformer
    sentence: CaseTransformer
    snake: CaseTransformer
    swap: CaseTransformer
    title: CaseTransformer
    upper: CaseTransformer
    upperFirst: CaseTransformer
}

const changeCase: ChangeCaseFunctions = {
    camel: (input) => input
        .replace(/[-_\.\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^(.)/, (chr) => chr.toLowerCase()),

    constant: (input) => input
        .replace(/[-_\.\s]+/g, '_')
        .toUpperCase(),

    dot: (input) => input
        .replace(/[-_\s]+/g, '.')
        .toLowerCase(),

    kebab: (input) => input
        .replace(/[-_\.\s]+/g, '-')
        .toLowerCase(),

    lower: (input) => input.toLowerCase(),

    lowerFirst: (input) => input.charAt(0).toLowerCase() + input.slice(1),

    no: (input) => input.replace(/[-_\.]+/g, ' ').toLowerCase(),

    param: (input) => input
        .replace(/[-_\.\s]+/g, '-')
        .toLowerCase(),

    pascal: (input) => input
        .replace(/[-_\.\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^(.)/, (chr) => chr.toUpperCase()),

    path: (input) => input
        .replace(/[-_\.\s]+/g, '/')
        .toLowerCase(),

    sentence: (input) => input
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (chr) => chr.toUpperCase()),

    snake: (input) => input
        .replace(/[-_\.\s]+/g, '_')
        .toLowerCase(),

    swap: (input) => input
        .split('')
        .map((char) => (char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()))
        .join(''),

    title: (input) => input
        .replace(/\b\w/g, (chr) => chr.toUpperCase())
        .replace(/[-_\.]+/g, ' '),

    upper: (input) => input.toUpperCase(),

    upperFirst: (input) => input.charAt(0).toUpperCase() + input.slice(1),
};

export {
    changeCase
}

export type {
    CaseTransformer,
    ChangeCaseFunctions
}
