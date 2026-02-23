// Better Auth type extensions
// Extending the Better Auth user types with custom fields

import type { Session as BetterAuthSession } from "better-auth/types";

declare module "better-auth/types" {
    interface User {
        username?: string;
        firstName?: string;
        lastName?: string;
        isAdmin?: boolean;
        isMFAEnabled?: boolean;
        avatar?: string;
    }
    
    interface Session {
        user: User & {
            id: string;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }
}

export {};
