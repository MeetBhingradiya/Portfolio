import crypto from "crypto";
import { Config } from "@Config";

const SECRET_KEY = Config.Env.STATE_SIGNATURE || "STATE_SIGNATURE";

function generateHMACSignature(jsonData: any, SecretKey: string = SECRET_KEY) {
    const clonedData = JSON.parse(JSON.stringify(jsonData));
    const Minify = JSON.stringify(clonedData);
    return crypto.createHmac("sha256", SecretKey).update(Minify).digest("hex");
}

export {
    generateHMACSignature
}