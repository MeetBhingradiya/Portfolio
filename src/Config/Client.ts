import { Client_Config_Type } from "./type";

export const Config: Client_Config_Type = {
    Environment: "development",
    Notification: {
        enabled: false,
        message: "🎉 New features available! Check out our latest updates.",
        type: "info",
        link: {
            text: "Learn more",
            href: "/blogs"
        },
        dismissible: true
    }
}