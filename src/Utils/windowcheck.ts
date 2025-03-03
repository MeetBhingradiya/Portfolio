/**
 * Checks if the global `window` object is defined.
 *
 * This function returns a boolean that indicates if the code is running in a browser environment by verifying
 * the existence of the `window` object.
 *
 * @returns true if the `window` object is available, false otherwise.
 */


function windowchek(): boolean {
    return typeof window !== "undefined";
}

export { windowchek };