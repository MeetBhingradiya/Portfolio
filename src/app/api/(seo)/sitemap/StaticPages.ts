import {
    mapEndpointsToPriorities
} from "@Utils/Sitemap";
import type {
    EndpointFrequency
} from "@Utils/Sitemap";

export const StaticEndpointsPages: Array<EndpointFrequency> = [
    {
        route: '',
        frequency: "daily",
    },
    {
        route: 'contact',
        frequency: "weekly",
    },
    {
        route: 'Tools',
        frequency: "weekly",
    },
    {
        route: 'Tools/QR',
        frequency: "weekly",
    },
    {
        route: 'Tools/UUID',
        frequency: "weekly",
    },
    {
        route: 'Tools/CRX',
        frequency: "weekly",
    },
    {
        route: 'Tools/DateAndTime',
        frequency: "weekly",
    },
    {
        route: 'Tools/JSONObject',
        frequency: "weekly",
    },
    {
        route: 'Tools/Colour',
        frequency: "weekly",
    },
    {
        route: 'Tools/RegExp',
        frequency: "weekly",
    },
    {
        route: 'Tools/JWT',
        frequency: "weekly",
    },
    {
        route: 'Tools/Password',
        frequency: "weekly",
    },
    {
        route: 'Tools/Hash',
        frequency: "weekly",
    },
    {
        route: 'Tools/ImageToPDF',
        frequency: "weekly",
    },
    {
        route: 'Tools/ImageCompress',
        frequency: "weekly",
    },
    {
        route: 'Tools/EncryptAndDecrypt',
        frequency: "weekly",
    },
    {
        route: 'Tools/DateAndTime',
        frequency: "weekly",
    },
    {
        route: 'Tools/Markdown',
        frequency: "weekly",
    },
];

export const StaticPages = mapEndpointsToPriorities(StaticEndpointsPages);