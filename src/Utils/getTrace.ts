/**
 * Retrieves the CSRF token from the API trace endpoint.
 *
 * This function sends a POST request to `/api/trace` and returns the parsed JSON response.
 *
 * @returns The JSON data containing the CSRF token.
 */


async function getCSRFToken() {
    const response = await fetch('/api/trace', { method: 'POST' });
    const data = await response.json();
    return data
}

export { getCSRFToken };