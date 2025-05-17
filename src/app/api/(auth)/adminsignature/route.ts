import { NextRequest } from "next/server";
import { useEmptyFields } from "@Hooks";
import { Config } from "@Config";
import { ControllerResponseMap } from "@Utils";
import { createHash } from "crypto";
import * as jose from 'jose';

export async function POST(req: NextRequest) {
    try {
        let Request = await req.json();

        if (useEmptyFields({
            targetObject: Request,
            ReqiuredFields: ["signature"]
        }).isMissing) {
            return ControllerResponseMap({
                Status: 0,
                Message: 'Missing required fields',
                StatusCode: 400
            });
        }

        // ? Create SHA-512 Hash of the Signature
        const SignatureHash = createHash('sha512').update(Request.signature).digest('hex');

        if (SignatureHash === Config.Env.ADMIN_SIGNATURE) {
            const secret = new TextEncoder().encode(Config.Env.ADMIN_SIGNATURE);
            const token = await new jose.SignJWT({
                signature: SignatureHash
            })
                .setProtectedHeader({ alg: 'HS256' })
                .setExpirationTime('30m')
                .sign(secret);

            return ControllerResponseMap({
                Status: 1,
                Message: 'Signature is valid',
                StatusCode: 200,
                Data: token
            });
        } else {

            return ControllerResponseMap({
                Status: 0,
                Message: 'Signature is invalid',
                StatusCode: 400
            });
        }

    } catch (error: any) {
        return ControllerResponseMap({
            Status: 0,
            Message: 'Internal server error',
            StatusCode: 500,
            Debug: error?.message
        });
    }
}