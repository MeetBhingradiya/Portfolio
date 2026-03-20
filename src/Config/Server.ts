import { Server_Config_Type } from "./type";

export const Config: Server_Config_Type = {
    Environment: process.env.NODE_ENV === "production" ? "production" : "development",
    Immich_Endpoints: {
        Mobile_Redirect: "/api/oauth/mobile-redirect",
        Authorization: "/auth/login",
        User_Settings: "/user-settings"
    },
    Immich_Origins: [
        "https://photos.meetbhingradiya.in",
        "https://photos.meetbhingradiya.shop",
        "https://home-desktop.tail1c91d0.ts.net",
        "http://bfamily.myftp.org:2283"
    ],
}