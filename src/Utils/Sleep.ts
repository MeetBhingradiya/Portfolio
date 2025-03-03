/**
 * Delays execution for a specified number of milliseconds.
 *
 * Returns a Promise that resolves after the given delay, allowing asynchronous operations 
 * to pause without blocking the thread.
 *
 * @param ms - The delay duration in milliseconds.
 */


function Sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export {
    Sleep
};