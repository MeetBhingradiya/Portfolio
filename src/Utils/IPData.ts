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

    // ? IPData Website API Key 😂 got from Network menu
    Value: "eca677b284b3bac29eb72f5e496aa9047f26543605efe99ff2ce35c9"
}

// ? Browser Spoofing Headers (if required we add more here even we pass windows.navigator object if they validate)
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

        // ? Native Fetch 😅
        // const response = await fetch(API_URL.href, {
        //     headers: headers
        // });

        // return await response.json();

        // ? Hot Axios ♨️
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