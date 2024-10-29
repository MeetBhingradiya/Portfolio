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
            colors: {
                // ? Accent (Neon Purple)
                accent: "#805AD5",

                // ? Dark Mode (Neon Dark)
                // bgDark: "#1A202C",
                // bgDarkCard: "#2D3748",
                // textDark: "#E2E8F0",
                // textDarkSecondary: "#A0AEC0",
                bgDark: "#1A202C",
                bgDarkCard: "#2D3748",
                textDark: "#E2E8F0",
                textDarkSecondary: "#A0AEC0",

                // ? Light Mode (Minimal Light)
                // bgLight: "#F7FAFC",
                // bgLightCard: "#EDF2F7",
                // textLight: "#2D3748",
                bgLight: "#FFFFFF",
                bgLightCard: "#F9FAFB",
                textLight: "#1A202C",
                textLightSecondary: "#718096",
            }
        },
    },
    darkMode: "class",  
    plugins: [
        nextui()
    ],
};
export default config;
