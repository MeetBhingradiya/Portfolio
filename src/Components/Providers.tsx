import { NextUIProvider, NextUIProviderProps } from "@nextui-org/react";
import { buildProvidersTree } from "./BuildProvidersTree";

export function Providers({ children }: { children: React.ReactNode }) {

    const ProvidersTree = buildProvidersTree([
        [
            NextUIProvider, 
            {
                theme: 'dark',
                children
            } as NextUIProviderProps
        ]
    ]);

    return (
        <ProvidersTree>
            {children}
        </ProvidersTree>
    );
}