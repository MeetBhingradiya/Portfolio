import path from 'path';
import { NextConfig } from 'next';
import { CSPGenerator } from './src/Utils/CSP';
import type {
    CSPDirectiveOptions
} from './src/Utils/CSP';

const __dirname = path.resolve();

const nextConfig: NextConfig = {
    reactStrictMode: false,
    images: {
        loader: 'custom',
        loaderFile: "./src/Utils/RemoteImageLoader.ts",
        minimumCacheTTL: 60,
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: CSPGenerator({
                            directive: {
                                // ? No Iframe Allowed
                                'frame-ancestors': {
                                    None: true
                                },
                                // ? Any Domain Image Allowed
                                'img-src': {
                                    Self: true,
                                    Domains: ['*']
                                },
                                // ? No Script Allowed (Inline or External or Eval)
                                'script-src': {
                                    Self: true,
                                },
                            },
                            minify: true,
                            removeWhitespace: true
                        })
                    }
                ]
            }
        ];
    },
    sassOptions: {
        silenceDeprecations: ["legacy-js-api"],
        implementation: 'sass'
    },
    webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
        let Config = {
            ...config,
            resolve: {
                ...config.resolve,
                alias: {
                    '@Root': path.resolve(__dirname, './'),
                    '@Public': path.resolve(__dirname, './src/public'),
                    '@': path.resolve(__dirname, './src'),
                    '@App': path.resolve(__dirname, './src/app'),
                    '@Pages': path.resolve(__dirname, './src/Pages'),
                    "@Components": path.resolve(__dirname, "./src/Components"),
                    "@Controllers": path.resolve(__dirname, "./src/Controllers"),
                    "@Data": path.resolve(__dirname, "./src/Data"),
                    "@Hooks": path.resolve(__dirname, "./src/Hooks"),
                    "@Models": path.resolve(__dirname, "./src/Models"),
                    "@Styles": path.resolve(__dirname, "./src/Styles"),
                    "@Types": path.resolve(__dirname, "./src/Types"),
                    "@Utils": path.resolve(__dirname, "./src/Utils"),
                    ...config.resolve.alias,
                },
                extensions: [
                    '.css',
                    '.mdx',
                    '.ts',
                    '.tsx',
                    '.json',
                    '.svg',
                    '.webp',
                    '.png',
                    '.jpg',
                    '.ico',
                    '.js',
                    '.jsx',
                    ...config.resolve.extensions
                ],
            },
            experiments: {
                topLevelAwait: true,
                layers: true
            },
        };
        return Config;
    }
};

export default nextConfig;