/**
 *  @FileID          Hooks/useEmptyFields.ts
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
 *  @created 03/03/25 8:10 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


interface IuseEmptyFields {
    ReqiuredFields: Array<string>
    targetObject: any
}

interface useEmptyFields_Return {
    isMissing: boolean
    MissingFields: Array<string>
    Length: number
}

/**
 * ? check in object if the required fields are present in the object.
 */
function useEmptyFields({
    ReqiuredFields,
    targetObject: inputObject
}: IuseEmptyFields): useEmptyFields_Return {
    if (ReqiuredFields === undefined) {
        throw new Error("Required Fields are not provided in useEmptyFields Hook");
    }

    if (inputObject === undefined || inputObject === null) {
        return {
            isMissing: true,
            MissingFields: ReqiuredFields,
            Length: ReqiuredFields.length
        }
    }

    let processedObject = inputObject;

    if (typeof inputObject === 'string') {
        try {
            processedObject = JSON.parse(inputObject);
        } catch (error) {
            console.error("Failed to parse string as JSON in useEmptyFields:", error);
            return {
                isMissing: true,
                MissingFields: ReqiuredFields,
                Length: ReqiuredFields.length
            };
        }
    }

    const Empty_Fields: Array<string> = ReqiuredFields.filter((field: string) => {
        return !(field in processedObject) || processedObject[field] === undefined || processedObject[field] === null;
    })

    if (Empty_Fields.length > 0) {
        return {
            isMissing: true,
            MissingFields: Empty_Fields,
            Length: Empty_Fields.length
        }
    } else {
        return {
            isMissing: false,
            MissingFields: [],
            Length: 0
        }
    }
}

export {
    useEmptyFields
}

export type {
    IuseEmptyFields,
    useEmptyFields_Return
}