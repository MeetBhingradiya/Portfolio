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
			},
			animation: {
				"spin-slow": "spin 3s linear infinite",
				"pulse-slow": "pulse 3s ease-in-out infinite",
				"bounce-slow": "bounce 2s infinite",
				float: "float 6s ease-in-out infinite",
				glow: "glow 2s ease-in-out infinite alternate",
			},
			keyframes: {
				float: {
					"0%, 100%": { transform: "translateY(0px)" },
					"50%": { transform: "translateY(-20px)" },
				},
				glow: {
					"0%": {
						boxShadow:
							"0 0 5px theme(colors.blue.400), 0 0 10px theme(colors.blue.400), 0 0 15px theme(colors.blue.400)",
					},
					"100%": {
						boxShadow:
							"0 0 10px theme(colors.purple.400), 0 0 20px theme(colors.purple.400), 0 0 30px theme(colors.purple.400)",
					},
				},
			},
		},
	},
	darkMode: "class",
	plugins: [heroui()],
};
export default config;
