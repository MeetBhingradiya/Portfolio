import axios from "axios";

type Iip = `${number}.${number}.${number}.${number}` | string;

export type IPDataResponse = {
    ip: Iip;
    city?: string;
    region?: string;
    region_code?: string;
    country_name?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
};

export type IPDataError = {
    isERROR: true;
    Message: string;
};

const API = "https://api.ipdata.co/";

const headers = {
    "Origin": "https://ipdata.co",
    "Referer": "https://ipdata.co/",
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
};

export async function IPData(ip?: Iip): Promise<IPDataResponse | IPDataError> {
    try {
        const key = process.env.IPDATA_WEBSITE_KEY || process.env.IPDATA_API_KEY || "";
        if (!key) {
            return {
                isERROR: true,
                Message: "IPDATA_WEBSITE_KEY or IPDATA_API_KEY is missing"
            };
        }

        const apiUrl = new URL(`${API}${ip ? ip : ""}`);
        apiUrl.searchParams.set("api-key", key);

        const response = await axios.get<IPDataResponse>(apiUrl.href, {
            headers,
            timeout: 8000
        });

        return response.data;
    } catch (error: any) {
        return {
            isERROR: true,
            Message: error?.response?.data?.message || error?.message || "Failed to resolve IP location"
        };
    }
}
