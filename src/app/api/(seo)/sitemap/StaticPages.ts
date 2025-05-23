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
        route: 'Tools/ColourConvert',
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
];

export const StaticPages = mapEndpointsToPriorities(StaticEndpointsPages);