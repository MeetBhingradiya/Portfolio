import { Config } from "@Config/index";

type Iip = `${number}.${number}.${number}.${number}`;

const API = "https://api.ipdata.co/";
const Query = {
    Key: "api-key",
    Value: "eca677b284b3bac29eb72f5e496aa9047f26543605efe99ff2ce35c9"
}
const headers = {
    'Origin': 'https://ipdata.co',
    'Referer': 'https://ipdata.co/',
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'User-Agent': Config.CORS.Useragent,
}

async function IPData(ip?: Iip) {
    const API_URL = new URL(`${API}${ip ? ip : ""}`);
    API_URL.searchParams.set(Query.Key, Query.Value);

    const response = await fetch(API_URL.href, {
        headers: headers
    });

    return await response.json();
}

export {
    IPData
}