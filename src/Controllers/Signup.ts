import { NextResponse } from "next/server";
import { Users_Model as EnhancedUsers_Model } from "@Models/EnhancedUsers";
import { Config } from "@Config";

async function is_email_already_exists(email: string): Promise<boolean> {
    const doc = await EnhancedUsers_Model.findOne({
        email: email.toLowerCase()
    });
    return doc ? true : false;
}

async function is_email_Verified(email: string): Promise<boolean> {
    const doc = await EnhancedUsers_Model.findOne({
        email: email.toLowerCase(),
        isEmailVerified: true
    });
    return doc ? true : false;
}

async function is_username_created(email: string): Promise<boolean> {
    const doc = await EnhancedUsers_Model.findOne({
        email: email.toLowerCase(),
        "profile.username": { $exists: true, $ne: null }
    });

    return doc ? true : false;
}

async function is_username_already_exists(username: string): Promise<boolean> {
    const doc = await EnhancedUsers_Model.findOne({
        "profile.username": username.toLowerCase()
    });
    return doc ? true : false;
}

async function Signup() {}

export {
    is_email_already_exists,
    is_email_Verified,
    is_username_created,
    is_username_already_exists
};
