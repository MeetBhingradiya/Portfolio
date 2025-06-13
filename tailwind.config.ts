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
			boxShadow: {
				admin: "0 10px 25px -5px rgba(243, 18, 96, 0.25)",
			},
			animation: {
				"spin-slow": "spin 3s linear infinite",
				"pulse-slow": "pulse 3s ease-in-out infinite",
				"bounce-slow": "bounce 2s infinite",
				float: "float 6s ease-in-out infinite",
				glow: "glow 2s ease-in-out infinite alternate",
				"admin-pulse": "adminPulse 2.5s ease-in-out infinite",
				"admin-glow": "adminGlow 2.5s ease-in-out infinite",
				"admin-shimmer": "adminShimmer 3s ease-in-out infinite",
				"admin-badge-pulse": "adminBadgePulse 2s ease-in-out infinite",
				"slow-spin": "spin 20s linear infinite",
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
				adminPulse: {
					"0%": {
						opacity: "0.3",
						transform: "scale(1)",
					},
					"50%": {
						opacity: "0.6",
						transform: "scale(1.05)",
					},
					"100%": {
						opacity: "0.3",
						transform: "scale(1)",
					},
				},
				adminGlow: {
					"0%": {
						filter: "drop-shadow(0 0 10px rgba(243, 18, 96, 0.3))",
					},
					"50%": {
						filter: "drop-shadow(0 0 20px rgba(243, 18, 96, 0.5))",
					},
					"100%": {
						filter: "drop-shadow(0 0 10px rgba(243, 18, 96, 0.3))",
					},
				},
				adminShimmer: {
					"0%": {
						backgroundPosition: "-100% 0",
					},
					"100%": {
						backgroundPosition: "200% 0",
					},
				},
				adminBadgePulse: {
					"0%": {
						transform: "scale(1)",
					},
					"50%": {
						transform: "scale(1.15)",
					},
					"100%": {
						transform: "scale(1)",
					},
				},
			},
		},
	},
	darkMode: "class",
	plugins: [heroui()],
};
export default config;
