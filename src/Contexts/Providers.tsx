import { HeroUIProvider } from "@heroui/system";
import { buildProvidersTree, defineProvider } from "@/Utils/Providers_Tree_Builder";
// import MUIRegistry from "./MUIRegistry";
// import { AuthProviders } from "./AuthProviders";
// import { AccountProvider } from "../contexts/AccountContext";
import { DesignThemeProvider } from "@Hooks";

export function Providers({ children }: { children: React.ReactNode }) {
    const ProvidersTree = buildProvidersTree([
        defineProvider({ component: HeroUIProvider }),
        defineProvider({ component: DesignThemeProvider })

        // [
        //     MUIRegistry,
        //     {
        //         options: {
        //             key: "muiregistry"
        //         },
        //         children
        //     }
        // ],
        // [
        //     AccountProvider,
        //     {
        //         children
        //     }
        // ],
        // [
        //     AuthProviders,
        //     {
        //         children
        //     }
        // ],
    ]);

    return <ProvidersTree>{children}</ProvidersTree>;
}