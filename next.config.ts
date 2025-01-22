import path from 'path';
import { NextConfig } from 'next';
import { CSPGenerator, CSPDirectiveOptions } from './src/Utils/CSP';
import tsconfig from './tsconfig.json';

const nextConfig: NextConfig = {
    reactStrictMode: false,
    devIndicators: {
        appIsrStatus: false,
    },
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
                                [CSPDirectiveOptions.FrameSrc]: {
                                    Domains: [
                                        '*',
                                    ],
                                    Self: true
                                },
                                [CSPDirectiveOptions.FrameAncestors]: {
                                    None: true
                                },
                                [CSPDirectiveOptions.ImgSrc]: {
                                    Self: true,
                                    Domains: ['*']
                                },
                                [CSPDirectiveOptions.ScriptSrc]: {
                                    Self: true,
                                    Inline: true,
                                    Eval: true,
                                    Domains: [
                                        'https://pagead2.googlesyndication.com',
                                        'https://ep2.adtrafficquality.google'
                                    ]
                                }
                            },
                            minify: true,
                            removeWhitespace: true
                        })
                    }
                ]
            }
        ];
    },

    // ? SASS Options
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
                    ...Object.fromEntries(
                        Object.entries(tsconfig.compilerOptions.paths).map(([key, value]) => [
                            key.replace('/*', ''),
                            path.resolve(path.resolve(), value[0].replace('/*', ''))
                        ])
                    ),
                    ...config.resolve.alias,
                },
                extensions: [
                    '.tsx',
                    '.ts',
                    '.jsx',
                    '.js',
                    '.sass',
                    '.ico',
                    '.svg',
                    '.webp',
                    '.mdx',
                    '.json',
                    '.css',
                    '.png',
                    '.jpg',
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