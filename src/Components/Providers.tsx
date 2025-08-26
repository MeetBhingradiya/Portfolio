import { HeroUIProvider } from "@heroui/system";
import { buildProvidersTree } from "./BuildProvidersTree";
import MUIRegistry from "@Components/MUIRegistry";
import { AuthProviders } from "@Components/AuthProviders";
import { AccountProvider } from "@contexts/AccountContext";

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
                    key: "muiregistry"
                },
                children
            }
        ],
        [
            AccountProvider,
            {
                children
            }
        ],
        [
            AuthProviders,
            {
                children
            }
        ]
    ]);

    return <ProvidersTree>{children}</ProvidersTree>;
}
