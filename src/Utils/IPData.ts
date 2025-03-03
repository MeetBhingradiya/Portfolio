/**
 *  @FileID          Utils/IPData.ts
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
 *  @created 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


import { Config } from "@Config";
import Axios from "axios";

type Iip = `${number}.${number}.${number}.${number}` | string;

type IResponse = {
    ip: Iip
    is_eu: boolean
    city: string
    region: string
    region_code: string
    country_name: string
    country_code: string
    continent_name: string
    continent_code: string
    latitude: number
    longitude: number
    postal: string
    calling_code: string
    flag: string
    emoji_flag: string
    emoji_unicode: string
    asn: {
        asn: string
        name: string
        domain: string
        route: string
        type: string
    }
    company: {
        name: string
        domain: string
        type: string
        network: string
    }
    languages: [
        {
            name: string
            native: string
            code: string
        }
    ]
    currency: {
        name: string
        code: string
        symbol: string
        native: string
        plural: string
    }
    time_zone: {
        name: string
        abbr: string
        offset: string
        is_dst: boolean
        current_time: string
    }
    threat: {
        is_tor: boolean
        is_vpn: boolean
        is_icloud_relay: boolean
        is_proxy: boolean
        is_datacenter: boolean
        is_anonymous: boolean
        is_known_attacker: boolean
        is_known_abuser: boolean
        is_threat: boolean
        is_bogon: boolean
        blocklist: [
            {
                name: string
                site: string
                type: string
            }
        ]
        scores: {
            vpn_score: number
            proxy_score: number
            threat_score: number
            trust_score: number
        }
    }
}

const API = "https://api.ipdata.co/";
const Query = {
    Key: "api-key",
    Value: process.env.IPDATA_WEBSITE_KEY || ""
}

// ? Browser Spoofing Headers (if required we add more here even we pass windows.navigator object if they validate 😅)
const headers = {
    'Origin': 'https://ipdata.co',
    'Referer': 'https://ipdata.co/',
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'User-Agent': Config.CORS.Useragent,
}

async function IPData(ip?: Iip): Promise<any> {
    try {
        const API_URL = new URL(`${API}${ip ? ip : ""}`);
        API_URL.searchParams.set(Query.Key, Query.Value);

        const response = await Axios.get(API_URL.href, {
            headers: headers
        });

        return response.data;
    } catch (error:any) {
        return {
            isERROR: true,
            Message: error.response.data.message
        }
    }

}

export {
    IPData,
}

export type {
    IResponse
}