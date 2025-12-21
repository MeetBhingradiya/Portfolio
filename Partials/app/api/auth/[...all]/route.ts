/**
 * Better Auth API Route Handler
 * Handles all authentication requests
 */

import { auth } from "../../../../Lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
