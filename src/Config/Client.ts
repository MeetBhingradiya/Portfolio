import { Client_Config_Type } from "./type";

export const Config: Client_Config_Type = {
    Environment: "development",
    Notification: {
        enabled: false,
        message: "🚧 Site is Under Development Alpha Phase",
        type: "info",
        link: {
            text: "Learn more",
            href: ""
        },
        dismissible: true
    },
    Emails: {
        domain: "meetbhingradiya.shop",
        contact: "contact@meetbhingradiya.shop",
        privacy: "privacy@meetbhingradiya.shop",
        security: "security@meetbhingradiya.shop",
        legal: "legal@meetbhingradiya.shop",
        dmca: "dmca@meetbhingradiya.shop"
    }
}