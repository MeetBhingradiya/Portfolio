import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",

        // ? NextUI
        './node_modules/@nextui-org/theme/dist/components/(button|snippet|code|input).js',
    ],
    theme: {
        extend: {
            
        },
    },
    darkMode: "class",  
    plugins: [
        nextui()
    ],
};
export default config;
