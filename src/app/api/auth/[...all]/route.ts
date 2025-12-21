/**
 * Better Auth API Route Handler
 * Catch-all route for all Better Auth endpoints
 * 
 * Handles:
 * - GET /api/auth/get-session
 * - POST /api/auth/sign-in/email
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-out
 * - POST /api/auth/update-user
 * - POST /api/auth/change-password
 * - GET /api/auth/list-sessions
 * - POST /api/auth/revoke-session
 * - POST /api/auth/revoke-other-sessions
 * - POST /api/auth/link-social
 * - POST /api/auth/unlink-account
 * - GET /api/auth/list-accounts
 * - And all other Better Auth endpoints
 */

import { auth } from "@/Library/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
