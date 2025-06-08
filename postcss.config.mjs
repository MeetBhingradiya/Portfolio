/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        "@tailwindcss/postcss": {
            optimize: true,
        },
        autoprefixer: {}
    },
};

export default config;