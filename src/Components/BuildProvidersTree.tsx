import React from "react";

type ProviderType<ProviderPropsType> = [React.ComponentType<ProviderPropsType>, ProviderPropsType];

type ChildrenType = {
    children: React.ReactNode
};

function buildProvidersTree<T extends Record<string, any>[]>(
    Providers: { [K in keyof T]: ProviderType<T[K]> },
    Theme: "light" | "dark" = "light"
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
