/**
 *  @file        Utils\Relativetime.ts
 *  @description No description available for Utils\Relativetime.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
 */

function getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);

    if (seconds < 60) {
        return diff < 0 ? `in ${seconds} seconds` : `${seconds} seconds ago`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return diff < 0 ? `in ${minutes} minutes` : `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return diff < 0 ? `in ${hours} hours` : `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return diff < 0 ? `in ${days} days` : `${days} days ago`;
    }

    // Future dates within the next 30 days
    if (diff < 0 && days <= 30) {
        return `in ${days} days`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return diff < 0 ? `in ${months} months` : `${months} months ago`;
    }

    const years = Math.floor(days / 365);
    return diff < 0 ? `in ${years} years` : `${years} years ago`;
}

export {
    getRelativeTime
}