"use client";

import { useState, useEffect, useCallback } from "react";

function initializeStorage(storageKey: string, storageType: "session" | "local") {

    const set = (key: string, value: any) => {
        if (typeof window !== "undefined") {
            const storage = storageType === "session" ? sessionStorage : localStorage;
            storage.setItem(key, JSON.stringify(value));
        }
    };

    const get = (key: string) => {
        if (typeof window !== "undefined") {
            const storage = storageType === "session" ? sessionStorage : localStorage;
            const item = storage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        return null;
    };

    const remove = (key: string) => {
        if (typeof window !== "undefined") {
            const storage = storageType === "session" ? sessionStorage : localStorage;
            storage.removeItem(key);
        }
    };

    return { set, get, remove };
}

export function useTheme(storageType: "session" | "local" = "local") {
    const storageKey = 'theme';
    const { set, get } = initializeStorage(storageKey, storageType);
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

    useEffect(() => {
        const storedTheme = get(storageKey);
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            set(storageKey, theme);
        }
    }, [get]);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            root.classList.remove("light", "dark");
            root.classList.add(systemTheme);
        } else {
            root.classList.remove("light", "dark");
            root.classList.add(theme);
        }
    }, [theme]);

    useEffect(() => {
        if (theme === "system") {
            const listener = (e: MediaQueryListEvent) => {
                const systemTheme = e.matches ? "dark" : "light";
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(systemTheme);
            };
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            mediaQuery.addEventListener("change", listener);

            return () => mediaQuery.removeEventListener("change", listener);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
        setTheme(newTheme);
        set(storageKey, newTheme);
    }, [theme, set, storageKey]);

    return { theme, toggleTheme };
}
