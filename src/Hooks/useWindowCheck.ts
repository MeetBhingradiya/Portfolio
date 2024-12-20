import { useEffect, useState } from "react";

function useWindowCheck(): boolean {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(typeof window !== "undefined");
    }, []);

    return isClient;
}

export { useWindowCheck };