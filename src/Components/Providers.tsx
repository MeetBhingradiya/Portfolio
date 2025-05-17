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