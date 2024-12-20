import { useState, useEffect } from 'react';
import { useWindowCheck } from './useWindowCheck';

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
