/**
 *  @FileID          Components\BuildProvidersTree.tsx
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
