/**
 *  @FileID          Controllers\Signup.ts
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
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */


import { NextRequest, NextResponse } from "next/server";
import { Users_Model } from "@Models/Users";
import dbConnect from "@Utils/dbConnect";

async function is_email_already_exists(email: string): Promise<boolean> {
    // return new Promise((resolve, reject) => {
    //     Users_Model.findOne({
    //         Emails: {
    //             $elemMatch: {
    //                 Email: email
    //             }
    //         }
    //     }, (err: any, doc: any) => {
    //         if (err) {
    //             reject(err);
    //         } else {
    //             resolve(doc);
    //         }
    //     });
    // });

    await dbConnect();
    const doc = await Users_Model.findOne({
        Emails: {
            $elemMatch: {
                Email: email
            }
        }
    });
    return doc ? true : false;
}

async function is_email_Verified(email: string): Promise<boolean> {
    // return new Promise((resolve, reject) => {
    //     Users_Model.findOne({
    //         Emails: {
    //             $elemMatch: {
    //                 Email: email,
    //                 isVerified: true
    //             }
    //         }
    //     }, (err: any, doc: any) => {
    //         if (err) {
    //             reject(err);
    //         } else {
    //             resolve(doc);
    //         }
    //     });
    // });

    await dbConnect();
    const doc = await Users_Model.findOne({
        Emails: {
            $elemMatch: {
                Email: email,
                isVerified: true
            }
        }
    });
    return doc ? true : false;
}

export {
    is_email_already_exists,
    is_email_Verified
}