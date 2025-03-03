/**
 * Retrieves environment variable values whose keys start with the specified prefix.
 *
 * The function filters the keys of the current process environment (process.env) by checking if they start
 * with the provided prefix and returns an array of the corresponding environment variable values.
 *
 * @param env - The prefix used to filter the environment variable keys.
 * @returns An array of environment variable values whose keys match the provided prefix.
 */


function getEnvs(env:string) {
    return Object.keys(process.env).filter(key => key.startsWith(env)).map(key => process.env[key]);
}

export {
    getEnvs
}