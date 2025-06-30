import path from "path";
import fs from "fs";
import { NextConfig } from "next";
import { CSPGenerator, CSPDirectiveOptions } from "./src/Utils/CSP";
import { jsonc } from "jsonc";

let tsconfig: any = jsonc.parse(
    fs.readFileSync(path.resolve(__dirname, "tsconfig.json"), "utf-8")
);

let Extensions = [
    ".tsx",
    ".ts",
    ".jsx",
    ".js",
    ".sass",
    ".ico",
    ".svg",
    ".webp",
    ".mdx",
    ".json",
    ".css",
    ".png",
    ".jpg"
];

// Development performance optimization
const isDev = process.env.NODE_ENV === 'development';
const useTurbopack = process.env.TURBOPACK === '1';

const nextConfig: NextConfig = {
    reactStrictMode: false,
    devIndicators: {
        position: "bottom-right"
    },
    productionBrowserSourceMaps: false,
    reactProductionProfiling: false,
    
    // SWC compiler options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
        styledComponents: true,
    },
    
    // Experimental features - cleaned up for latest Next.js
    experimental: {
        // Better memory management
        workerThreads: false,
        
        // Optimize bundling - these work with both webpack and turbopack
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            'framer-motion',
            '@heroicons/react',
            'react-icons',
            // Add your heavy packages here
        ],
        
        // Other performance features
        optimisticClientCache: true,
        serverMinification: true,
    },
    
    // Enhanced images config for dev performance
    images: {
        loader: "custom",
        loaderFile: "./src/Utils/RemoteImageLoader.ts",
        minimumCacheTTL: isDev ? 3600 : 60,
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*"
            }
        ],
        formats: ['image/webp', 'image/avif'],
    },

    // Only apply headers in production to speed up dev
    async headers() {
        if (isDev) return [];
        
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY"
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff"
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block"
                    },
                    {
                        key: "Referrer-Policy",
                        value: "same-origin"
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains; preload"
                    },
                    {
                        key: "Content-Security-Policy",
                        value: CSPGenerator({
                            directive: {
                                [CSPDirectiveOptions.FrameSrc]: {
                                    Domains: ["*"],
                                    Self: true
                                },
                                [CSPDirectiveOptions.FrameAncestors]: {
                                    None: true
                                },
                                [CSPDirectiveOptions.ImgSrc]: {
                                    Self: true,
                                    Data: true,
                                    Domains: ["*"]
                                },
                                [CSPDirectiveOptions.ScriptSrc]: {
                                    Self: true,
                                    Inline: true,
                                    Eval: true,
                                    Domains: [
                                        "https://pagead2.googlesyndication.com",
                                        "https://ep2.adtrafficquality.google",
                                        "https://va.vercel-scripts.com",
                                        "https://cdn.jsdelivr.net",
                                        "https://unpkg.com",
                                        "https://suggestqueries.google.com",
                                        "https://api.bing.com",
                                        "https://duckduckgo.com"
                                    ]
                                },
                                [CSPDirectiveOptions.ConnectSrc]: {
                                    Self: true,
                                    Domains: [
                                        "https://suggestqueries.google.com",
                                        "https://api.bing.com", 
                                        "https://duckduckgo.com",
                                        "*"
                                    ]
                                }
                            },
                            minify: true,
                            removeWhitespace: true
                        })
                    },
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "meetbhingradiya.tech, stage.meetbhingradiya.tech, dev.meetbhingradiya.tech, meetbhingradiya.shop"
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS"
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization"
                    },
                    {
                        key: "Access-Control-Allow-Credentials",
                        value: "true"
                    }
                ]
            }
        ];
    },

    // Enhanced SASS options
    sassOptions: {
        silenceDeprecations: ["legacy-js-api"],
        implementation: "sass",
        includePaths: [path.join(__dirname, "src", "Styles")],
        ...(isDev && {
            outputStyle: 'expanded',
            sourceMap: true,
        })
    },

    // Turbopack config - only valid options
    turbopack: {
        resolveExtensions: Extensions,
        // Memory limit is handled by NODE_OPTIONS in your .env.local
        // No memoryLimit option exists here
    },

    // Webpack config - only when NOT using Turbopack
    ...(!useTurbopack && {
        webpack: (
            config: any,
            { buildId, dev, isServer, defaultLoaders, webpack }: any
        ) => {
            // Development optimizations for webpack
            if (dev) {
                // Faster file watching
                config.watchOptions = {
                    poll: 1000,
                    aggregateTimeout: 300,
                    ignored: [
                        '**/node_modules/**',
                        '**/.git/**',
                        '**/dist/**',
                        '**/build/**',
                        '**/.next/**',
                        '**/coverage/**',
                        '**/*.log',
                    ]
                };

                // Memory optimizations for large projects
                config.optimization = {
                    ...config.optimization,
                    removeAvailableModules: false,
                    removeEmptyChunks: false,
                    splitChunks: {
                        chunks: 'async',
                        cacheGroups: {
                            default: false,
                            vendors: false,
                        }
                    },
                };

                // Faster rebuilds
                config.snapshot = {
                    module: {
                        timestamp: true,
                    },
                    resolve: {
                        timestamp: true,
                    },
                };

                // Enhanced caching for development
                config.cache = {
                    type: 'filesystem',
                    allowCollectingMemory: true,
                    buildDependencies: {
                        config: [__filename],
                    },
                    cacheDirectory: path.resolve('.next/cache'),
                };
            }

            // Enhanced resolve configuration
            const Config = {
                ...config,
                resolve: {
                    ...config.resolve,
                    alias: {
                        ...Object.fromEntries(
                            Object.entries(tsconfig.compilerOptions.paths).map(
                                ([key, value]: any) => [
                                    key.replace("/*", ""),
                                    path.resolve(
                                        path.resolve(),
                                        value[0].replace("/*", "")
                                    )
                                ]
                            )
                        ),
                        ...config.resolve.alias,
                        canvas: false
                    },
                    extensions: [...Extensions, ...config.resolve.extensions],
                    // Faster module resolution
                    symlinks: false,
                    cacheWithContext: false,
                    modules: ['node_modules'],
                },
                experiments: {
                    ...config.experiments,
                    topLevelAwait: true,
                    layers: true,
                }
            };

            return Config;
        },
    }),
    
    serverExternalPackages: ["sharp"],
    
    // Additional dev optimizations
    onDemandEntries: {
        maxInactiveAge: 25 * 1000,
        pagesBufferLength: 2,
    },
};

export default nextConfig;