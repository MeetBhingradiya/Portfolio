/**
 *  @file        Components\BuildProvidersTree.tsx
 *  @description No description available for Components\BuildProvidersTree.tsx.
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
