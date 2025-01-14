/**
 *  @FileID          Hooks\useStore.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
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
