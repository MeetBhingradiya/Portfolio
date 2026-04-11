import { Client_Config_Type } from "./type";
import { getPrimaryOrigin } from "@Utils/origin";

export const Config: Client_Config_Type = {
    Environment: "development",
    Notifications: [
        {
            enabled: false,
            message: "Site is Under Beta Phase, if you found bug please ignore that currently.",
            storageValue: "site-beta-v1",
            type: "warning",
            link: {
                text: "Learn more",
                href: ""
            },
            dismissible: true
        }
    ],
    Emails: {
        domain: "meetbhingradiya.shop",
        contact: "contact@meetbhingradiya.shop",
        privacy: "privacy@meetbhingradiya.shop",
        security: "security@meetbhingradiya.shop",
        legal: "legal@meetbhingradiya.shop",
        dmca: "dmca@meetbhingradiya.shop"
    },
    Origin: getPrimaryOrigin()
};
