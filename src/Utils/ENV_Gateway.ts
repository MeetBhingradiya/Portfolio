/**
 * Environment Variable Gateway
 * 
 * A security-focused utility that provides controlled access to environment variables.
 * This gateway implements a whitelist approach to prevent accidental exposure of sensitive
 * environment variables to the client-side or unauthorized parts of the application.
 * 
 * @module ENV_Gateway
 * @author Meet Bhingradiya
 * 
 * @security
 * **Security Benefits:**
 * - **Prefix Filtering**: Only exposes variables with the "PORTFOLIO_" prefix
 * - **Explicit Whitelisting**: Prevents accidental leakage of system or third-party env vars
 * - **Client-Side Safety**: Safe to use in Next.js client components (only allowed vars exposed)
 * - **Centralized Control**: Single point of access for environment configuration
 * - **Type Safety**: Returns a typed object with known environment variables
 * 
 * @example
 * // .env file:
 * PORTFOLIO_API_URL=https://api.example.com
 * PORTFOLIO_ENABLE_ANALYTICS=true
 * DATABASE_URL=secret                    // This will NOT be exposed
 * AWS_SECRET_KEY=secret                  // This will NOT be exposed
 * 
 * // Usage:
 * const env = ENV_Gateway();
 * console.log(env.PORTFOLIO_API_URL);    // ✅ Available
 * console.log(env.DATABASE_URL);         // ❌ undefined (filtered out)
 */

/**
 * Type definition for portfolio environment variables.
 * Extend this interface when adding new PORTFOLIO_* environment variables.
 * 
 * @interface PortfolioEnvVars
 */
interface PortfolioEnvVars {
    [key: string]: string | undefined;
}

/**
 * Filters and returns only environment variables that are prefixed with "PORTFOLIO_".
 * 
 * This function acts as a security gateway by:
 * 1. Iterating through all environment variables
 * 2. Filtering only those starting with "PORTFOLIO_"
 * 3. Returning a safe, sanitized object containing only whitelisted variables
 * 
 * **Why This Matters:**
 * - Prevents accidental exposure of sensitive credentials (DB passwords, API keys, etc.)
 * - Enforces a clear naming convention for application-specific variables
 * - Makes it explicit which variables are safe to use in client-side code
 * - Provides a clear audit trail for environment variable access
 * 
 * **Best Practices:**
 * - Always prefix portfolio-specific variables with "PORTFOLIO_"
 * - Use PORTFOLIO_PUBLIC_* for variables safe to expose to the browser
 * - Never access process.env directly in shared code; use this gateway instead
 * - Document all PORTFOLIO_* variables in your .env.example file
 * 
 * @returns {PortfolioEnvVars} An object containing only PORTFOLIO_* prefixed environment variables
 * 
 * @example
 * // Secure usage in a server component
 * const env = ENV_Gateway();
 * const apiUrl = env.PORTFOLIO_API_URL || 'https://default.api.com';
 * 
 * @example
 * // Checking for feature flags
 * const env = ENV_Gateway();
 * const analyticsEnabled = env.PORTFOLIO_ENABLE_ANALYTICS === 'true';
 * 
 * @example
 * // Safe to use in utilities that might run client-side
 * const env = ENV_Gateway();
 * const publicVars = Object.keys(env).filter(key => key.includes('PUBLIC'));
 */
function ENV_Gateway(): PortfolioEnvVars {
    // Initialize the result object to store filtered environment variables
    const portfolioEnvVars: PortfolioEnvVars = {};

    // Iterate through all environment variables available in process.env
    for (const key in process.env) {
        // Security Check: Only include variables that start with "PORTFOLIO_"
        // This ensures we never accidentally expose sensitive system variables,
        // database credentials, or third-party service keys
        if (key.startsWith('PORTFOLIO_')) {
            // Add the variable to our filtered result object
            portfolioEnvVars[key] = process.env[key];
        }
    }

    // Return the sanitized environment variables object
    return portfolioEnvVars;
}

/**
 * Gets a specific portfolio environment variable with optional default value.
 * Provides a type-safe way to access individual environment variables.
 * 
 * @param {string} key - The environment variable key (must start with "PORTFOLIO_")
 * @param {string} [defaultValue] - Optional default value if the variable is not set
 * @returns {string | undefined} The environment variable value or default
 * 
 * @throws {Error} If the key doesn't start with "PORTFOLIO_" (security enforcement)
 * 
 * @example
 * const apiUrl = getEnv('PORTFOLIO_API_URL', 'https://default.com');
 * const dbName = getEnv('PORTFOLIO_DB_NAME'); // Returns undefined if not set
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
    // Security validation: Enforce the PORTFOLIO_ prefix
    if (!key.startsWith('PORTFOLIO_')) {
        throw new Error(
            `Security Error: Environment variable "${key}" must start with "PORTFOLIO_" prefix. ` +
            `This gateway only allows access to whitelisted portfolio variables.`
        );
    }

    // Return the environment variable or the default value
    return process.env[key] ?? defaultValue;
}

/**
 * Checks if a specific portfolio environment variable exists and is not empty.
 * Useful for feature flags and conditional configuration.
 * 
 * @param {string} key - The environment variable key to check
 * @returns {boolean} True if the variable exists and has a non-empty value
 * 
 * @example
 * if (hasEnv('PORTFOLIO_ENABLE_FEATURE_X')) {
 *   // Feature X is enabled
 * }
 */
function hasEnv(key: string): boolean {
    const value = getEnv(key);
    return value !== undefined && value !== '';
}

/**
 * Validates that all required portfolio environment variables are present.
 * Useful for application startup checks to fail fast if configuration is incomplete.
 * 
 * @param {string[]} requiredKeys - Array of required environment variable keys
 * @throws {Error} If any required variable is missing
 * 
 * @example
 * // At application startup:
 * validateRequiredEnvVars([
 *   'PORTFOLIO_API_URL',
 *   'PORTFOLIO_DATABASE_NAME',
 *   'PORTFOLIO_AUTH_SECRET'
 * ]);
 */
function validateRequiredEnvVars(requiredKeys: string[]): void {
    const missing: string[] = [];

    for (const key of requiredKeys) {
        if (!hasEnv(key)) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n` +
            missing.map(key => `  - ${key}`).join('\n') +
            `\n\nPlease set these variables in your .env file.`
        );
    }
}

export { ENV_Gateway, getEnv, hasEnv, validateRequiredEnvVars };
export type { PortfolioEnvVars };

