import * as jose from "jose";
import { Config } from "@Config";

async function verifyAdminToken(token: string): Promise<boolean> {
    try {
        if (!token) return false;

        const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
        const verified = await jose.jwtVerify(token, secret);

        if (!verified) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

export { verifyAdminToken };
