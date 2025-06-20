import { HeroUIProvider } from "@heroui/system";
import { buildProvidersTree } from "./BuildProvidersTree";
import MUIRegistry from "@Components/MUIRegistry";
import { AuthProvider } from "@contexts/AuthContext";
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
            AuthProvider,
            {
                children
            }
        ],
        [
            AccountProvider,
            {
                children
            }
        ]
    ]);

    return <ProvidersTree>{children}</ProvidersTree>;
}
