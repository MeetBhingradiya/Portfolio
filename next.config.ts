import path from 'path';
import { NextConfig } from 'next';

const __dirname = path.resolve();

const nextConfig: NextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "img.icons8.com"
            }
        ],
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
                        value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; frame-src 'self'; base-uri 'self'; form-action 'self';`
                    },
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
                    '@': path.resolve(__dirname, './src'),
                    '@App': path.resolve(__dirname, './src/app'),
                    '@Pages': path.resolve(__dirname, './src/Pages'),
                    "@Components": path.resolve(__dirname, "./src/Components"),
                    "@Styles": path.resolve(__dirname, "./src/Styles"),
                    "@Utils": path.resolve(__dirname, "./src/Utils"),
                    ...config.resolve.alias,
                },
                extensions: [
                    '.sass',
                    '.css',
                    '.scss',
                    '.mdx',
                    '.ts',
                    '.tsx',
                    '.json',
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