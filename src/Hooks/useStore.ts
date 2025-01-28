/**
 *  @FileID          Hooks\useStore.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
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
