import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
            isAdmin: boolean;
            isEmailVerified: boolean;
            isMFAEnabled: boolean;
            avatar?: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        username: string;
        firstName: string;
        lastName: string;
        isAdmin: boolean;
        isEmailVerified: boolean;
        isMFAEnabled: boolean;
        avatar?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        userId: string;
        username: string;
        firstName: string;
        lastName: string;
        isAdmin: boolean;
        isEmailVerified: boolean;
        isMFAEnabled: boolean;
        avatar?: string;
    }
}
