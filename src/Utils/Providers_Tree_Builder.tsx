/**
 * ProvidersTree Utility
 *
 * A utility module for composing multiple React Context Providers into a single nested tree structure.
 * This eliminates the "Provider Hell" anti-pattern where multiple context providers create deeply
 * nested JSX structures that are difficult to read and maintain.
 *
 * @module ProvidersTree
 * @author Meet Bhingradiya
 */

import React from "react";

/**
 * Provider configuration object with explicit component and props properties.
 * This provides an intuitive and readable syntax for defining providers.
 *
 * @template P - The type of props accepted by the provider component
 * @typedef {Object} ProviderConfig
 * @property {React.ComponentType<P>} component - The provider component to render
 * @property {Omit<P, 'children'>} [props] - Optional props to pass to the provider (excluding children)
 *
 * @example
 * const config: ProviderConfig<ThemeProviderProps> = {
 *   component: ThemeProvider,
 *   props: { theme: 'dark', mode: 'system' }
 * };
 */
type ProviderConfig<P = any> = {
    component: React.ComponentType<P>;
    props?: Omit<P, "children">;
};

/**
 * Standard children prop type for React components.
 *
 * @typedef {Object} ChildrenType
 * @property {React.ReactNode} children - Child elements to be rendered within the provider tree
 */
type ChildrenType = {
    children: React.ReactNode;
};

/**
 * Builds a nested provider tree from an array of provider configurations.
 *
 * This function accepts provider configurations in object format:
 * `{ component: ProviderComponent, props: {...} }`
 *
 * The object format offers several advantages:
 * - More explicit and self-documenting
 * - Props are optional (defaults to empty object)
 * - Better IDE autocomplete support
 * - Easier to read and maintain
 *
 * This approach offers several benefits:
 * - **Readability**: Replaces deeply nested JSX with a clean array configuration
 * - **Maintainability**: Easy to add, remove, or reorder providers
 * - **Type Safety**: Preserves TypeScript type inference for provider props
 * - **Performance**: Creates the provider tree once during component initialization
 * - **Intuitive API**: Clear component and props separation
 *
 * @param {ProviderConfig[]} providers - Array of provider configurations in object format
 * @returns {React.FC<ChildrenType>} A composed component that renders all providers nested
 *
 * @example
 * // Without buildProvidersTree (Provider Hell):
 * <ThemeProvider theme="dark">
 *   <AuthProvider user={user}>
 *     <DataProvider cache={cache}>
 *       <App />
 *     </DataProvider>
 *   </AuthProvider>
 * </ThemeProvider>
 *
 * @example
 * // With buildProvidersTree:
 * const ProvidersTree = buildProvidersTree([
 *   { component: ThemeProvider, props: { theme: 'dark' } },
 *   { component: AuthProvider, props: { user } },
 *   { component: DataProvider, props: { cache } },
 *   { component: NotificationProvider } // No props needed
 * ]);
 *
 * <ProvidersTree>
 *   <App />
 * </ProvidersTree>
 *
 * @example
 * // Using defineProvider helper for type safety:
 * const ProvidersTree = buildProvidersTree([
 *   defineProvider({ component: ThemeProvider, props: { theme: 'dark' } }),
 *   defineProvider({ component: AuthProvider, props: { user } })
 * ]);
 */
function buildProvidersTree(providers: ProviderConfig[]): React.FC<ChildrenType> {
    /**
     * Base component that serves as the innermost wrapper.
     * Acts as the identity function in the reduce operation.
     *
     * @param {ChildrenType} props - Component props containing children
     * @returns {React.ReactElement} Fragment containing the children
     */
    function InitialComponent({ children }: ChildrenType) {
        return <>{children}</>;
    }

    /**
     * Reducer callback that accumulates providers into a nested structure.
     *
     * For each provider in the array, this function wraps the accumulated components
     * with the current provider, building the tree from the inside out.
     *
     * @param {React.FC<ChildrenType>} AccumulatedComponents - Previously accumulated provider tree
     * @param {ProviderConfig} config - Current provider configuration
     * @returns {React.FC<ChildrenType>} New component with the current provider wrapping accumulated ones
     */
    function Callback(AccumulatedComponents: React.FC<ChildrenType>, config: ProviderConfig) {
        const { component: Provider, props = {} } = config;

        /**
         * Tree component that renders the current provider wrapping all accumulated providers.
         *
         * @param {ChildrenType} props - Component props containing children
         * @returns {React.ReactElement} Current provider wrapping the accumulated provider tree
         */
        return function Tree({ children }: ChildrenType) {
            return (
                <AccumulatedComponents>
                    <Provider {...props}>{children}</Provider>
                </AccumulatedComponents>
            );
        };
    }

    // Use Array.reduce to fold the providers array into a single nested component tree
    return providers.reduce(Callback, InitialComponent);
}

/**
 * Type helper for defining provider configurations with full type safety.
 * Use this to get better autocomplete and type checking for your provider props.
 *
 * @template P - The props type for the provider component
 * @param {ProviderConfig<P>} config - Provider configuration object
 * @returns {ProviderConfig<P>} The same configuration with inferred types
 *
 * @example
 * import { defineProvider } from './ProvidersTree';
 *
 * const themeProvider = defineProvider({
 *   component: ThemeProvider,
 *   props: { theme: 'dark', mode: 'system' } // Full autocomplete available
 * });
 *
 * const ProvidersTree = buildProvidersTree([themeProvider, ...]);
 */
function defineProvider<P>(config: ProviderConfig<P>): ProviderConfig<P> {
    return config;
}

export { buildProvidersTree, defineProvider };
export type { ProviderConfig, ChildrenType };
