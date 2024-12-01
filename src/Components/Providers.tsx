import { NextUIProvider, NextUIProviderProps } from "@nextui-org/react";
import { buildProvidersTree } from "./BuildProvidersTree";
import ThemeRegistry from '@Utils/ThemeRegistry';

export function Providers({ children }: { children: React.ReactNode }) {

    const ProvidersTree = buildProvidersTree([
        [
            NextUIProvider, 
            {
                theme: 'dark',
                children
            } as NextUIProviderProps
        ],
        [
            ThemeRegistry,
            {
                options: { key: 'nextui' },
                children
            }
        ]
    ]);

    return (
        <ProvidersTree>
            {children}
        </ProvidersTree>
    );
}