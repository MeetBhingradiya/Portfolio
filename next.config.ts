import path from 'path';
import { NextConfig } from 'next';

interface CSPGenerator_Options {
    defaultSrc?: string;
    scriptSrc?: string;
    styleSrc?: string;
    imgSrc?: string;
    fontSrc?: string;
    connectSrc?: string;
    frameAncestors?: string;
    frameSrc?: string;
    baseUri?: string;
    formAction?: string;
}

function CSPGenerate(options: CSPGenerator_Options): string {
    let csp = `
    default-src ${options.defaultSrc ?? 'self'}; 
    script-src ${options.scriptSrc ?? 'self'} 'unsafe-inline' 'unsafe-eval'; 
    style-src ${options.styleSrc ?? 'self'} 'unsafe-inline'; 
    img-src ${options.imgSrc ?? 'self'} data:; 
    font-src ${options.fontSrc ?? 'self'} data:; 
    connect-src ${options.connectSrc ?? 'self'}; 
    frame-ancestors ${options.frameAncestors ?? 'none'}; 
    frame-src ${options.frameSrc ?? 'self'}; 
    base-uri ${options.baseUri ?? 'self'}; 
    form-action ${options.formAction ?? 'self'};`

    // ? Remove New Lines
    csp = csp.replace(/\n/g, '');
    // ? Remove Multiple Spaces
    csp = csp.replace(/\s+/g, ' ');

    return csp;
}

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
                    // {
                    //     key: 'Content-Security-Policy',
                    //     value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; frame-src 'self'; base-uri 'self'; form-action 'self';`
                    // }
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