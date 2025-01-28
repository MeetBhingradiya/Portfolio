import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",

        // ? NextUI
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // ? Accent (Neon Purple)
                accent: "#805AD5",

                // ? Dark Mode (Neon Dark)
                bgDark: "#1A202C",
                bgDarkCard: "#2D3748",
                textDark: "#E2E8F0",
                textDarkSecondary: "#A0AEC0",

                // ? Light Mode (Minimal Light)
                bgLight: "#FFFFFF",
                bgLightCard: "#F9FAFB",
                textLight: "#1A202C",
                textLightSecondary: "#718096",
            }
        },
    },
    darkMode: "class",
    plugins: [
        heroui()
    ],
};
export default config;
