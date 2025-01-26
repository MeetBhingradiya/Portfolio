/**
 *  @FileID          Components\Providers.tsx
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

import { HeroUIProvider } from "@heroui/system";
import { buildProvidersTree } from "./BuildProvidersTree";
import MUIRegistry from '@Components/MUIRegistry';

export function Providers({ children }: { children: React.ReactNode }) {
    const ProvidersTree = buildProvidersTree([
        [
            HeroUIProvider,
            {
                children
            }
        ],
        [
            MUIRegistry,
            {
                options: {
                    key: "muiregistry",
                },
                children,
            },
        ],
    ]);

    return (
        <ProvidersTree>
            {children}
        </ProvidersTree>
    );
}