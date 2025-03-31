import path from 'path';
import fs from 'fs';
import { NextConfig } from 'next';
import { CSPGenerator, CSPDirectiveOptions } from './src/Utils/CSP';
import { jsonc } from 'jsonc';

let tsconfig: any = jsonc.parse(fs.readFileSync(path.resolve(__dirname, 'tsconfig.json'), 'utf-8'));

const nextConfig: NextConfig = {
    reactStrictMode: false,
    devIndicators: false,
    // crossOrigin: "anonymous",
    images: {
        loader: 'custom',
        loaderFile: "./src/Utils/RemoteImageLoader.ts",
        minimumCacheTTL: 60,
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: "*",
            }
        ]
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // ? Security Headers
                    // ? Prevents Clickjacking, MIME Sniffing, XSS, Referrer Leaks & IFrames Block                    
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
                    // ? CSP Headers
                    // ? Provides Security to Users by Blocking Unwanted Scripts and Resources Paste
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
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
                                    Data: true,
                                    Domains: ['*']
                                },
                                [CSPDirectiveOptions.ScriptSrc]: {
                                    Self: true,
                                    Inline: true,
                                    Eval: true,
                                    Domains: [
                                        'https://pagead2.googlesyndication.com',
                                        'https://ep2.adtrafficquality.google',
                                        'https://va.vercel-scripts.com',
                                        'https://cdn.jsdelivr.net',
                                    ],
                                }
                            },
                            minify: true,
                            removeWhitespace: true
                        })
                    },
                    // ? CORS Headers 
                    // ? Allow Origins From Config.WhiteListedDomains
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: 'meetbhingradiya.tech, stage.meetbhingradiya.tech, dev.meetbhingradiya.tech'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                ]
            }
        ];
    },

    // ? SASS Options
    sassOptions: {
        silenceDeprecations: ['legacy-js-api'],
        implementation: 'sass',
        includePaths: [path.join(__dirname, 'src', 'Styles')],
    },
    experimental: {
        turbo: {
            resolveAlias: {
                ...Object.fromEntries(
                    Object.entries(tsconfig.compilerOptions.paths).map(([key, value]: any) => [
                        key.replace('/*', ''),
                        path.resolve(path.resolve(), value[0].replace('/*', ''))
                    ])
                )
            },
            // ! Turbo Pack Missing Loader
            // rules: {
            //     // ? Image Loader
            //     'image/*': {
            //         loader: 'remote',
            //         asset: "sdfsd",
            //     },
            // }
        }
    },
    webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
        let Config = {
            ...config,
            resolve: {
                ...config.resolve,
                alias: {
                    ...Object.fromEntries(
                        Object.entries(tsconfig.compilerOptions.paths).map(([key, value]: any) => [
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