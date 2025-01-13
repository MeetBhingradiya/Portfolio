/**
 *  @file        Hooks\useStore.ts
 *  @description No description available for Hooks\useStore.ts.
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

import { useState, useEffect } from 'react';
import { useWindowCheck } from '@Hooks/useWindowCheck';

function useStore(storageKey: string, storageType: "session" | "local") {
    const [data, setData] = useState<any>({});
    const isClient = useWindowCheck();

    function set(key: string, value: any) {
        if (isClient) {
            if (storageType === "session") {
                sessionStorage.setItem(key, JSON.stringify(value));
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }
    }

    function get(key: string) {
        if (isClient) {
            if (storageType === "session") {
                return sessionStorage.getItem(key);
            } else {
                return localStorage.getItem(key);
            }
        }
    }

    function remove(key: string) {
        if (isClient) {
            if (storageType === "session") {
                sessionStorage.removeItem(key);
            } else {
                localStorage.removeItem(key);
            }
        }
    }

    useEffect(() => {
        if (isClient) {
            if (storageType === "session") {
                if (sessionStorage.getItem(storageKey) !== null) {
                    sessionStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    throw new Error("Session Storage is Empty or not available in this browser");
                }
            } else {
                if (localStorage.getItem(storageKey) !== null) {
                    localStorage.setItem(storageKey, JSON.stringify(data));
                } else {
                    throw new Error("Local Storage is Empty or not available in this browser");
                }
            }
        }
    }, []);

    return {
        data,
        set,
        get,
        remove,
        update: set
    };
};

export { useStore };
