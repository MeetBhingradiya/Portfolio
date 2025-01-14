/**
 *  @FileID          Components\BuildProvidersTree.tsx
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

import React from "react";

type ProviderType<ProviderPropsType> = [React.ComponentType<ProviderPropsType>, ProviderPropsType];

type ChildrenType = {
    children: React.ReactNode
};

function buildProvidersTree<T extends Record<string, any>[]>(
    Providers: { [K in keyof T]: ProviderType<T[K]> }
): React.FC<ChildrenType> {
    function InitialComponent({ children }: ChildrenType) {
        return <>{children}</>;
    }

    function Callback(
        AccumulatedComponents: React.FC<ChildrenType>,
        [PROVIDERS, PROPERTIES]: ProviderType<any>
    ) {
        return function Tree({ children }: ChildrenType) {
            return (
                <AccumulatedComponents>
                    <PROVIDERS {...PROPERTIES}>{children}</PROVIDERS>
                </AccumulatedComponents>
            );
        };
    }

    return Providers.reduce(Callback, InitialComponent);
}

export { buildProvidersTree };
