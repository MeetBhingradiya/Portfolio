import { HeroUIProvider } from "@heroui/system";
import { buildProvidersTree } from "./BuildProvidersTree";
import MUIRegistry from "./MUIRegistry";
import { AuthProviders } from "./AuthProviders";
import { AccountProvider } from "../contexts/AccountContext";
import { DesignThemeProvider } from "../Hooks/useDesignTheme";

export function Providers({ children }: { children: React.ReactNode }) {
    const ProvidersTree = buildProvidersTree([
        [
            DesignThemeProvider,
            {
                children
            }
        ],
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
        ],
    ]);

    return <ProvidersTree>{children}</ProvidersTree>;
}
