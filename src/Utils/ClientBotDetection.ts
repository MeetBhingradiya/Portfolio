export interface BotDetectionResult {
    isBot: boolean;
    reasons: string[];
    score: number;
}

export class ClientBotDetection {
    private static checks = [
        {
            name: "webdriver",
            check: () => !!(window as any).webdriver,
            weight: 50
        },
        {
            name: "chrome_runtime",
            check: () =>
                !!(window as any).chrome && !(window as any).chrome.runtime,
            weight: 0 // Chrome runtime is not a bot indicator
        },
        {
            name: "phantom",
            check: () =>
                !!(window as any).callPhantom || !!(window as any)._phantom,
            weight: 50
        },
        {
            name: "selenium",
            check: () => {
                const props = [
                    "__selenium_unwrapped",
                    "__webdriver_evaluate",
                    "__driver_evaluate"
                ];
                return props.some((prop) => (window as any)[prop]);
            },
            weight: 50
        },
        {
            name: "automation_extensions",
            check: () => {
                return (
                    !!document.documentElement.getAttribute("webdriver") ||
                    !!(navigator as any).webdriver ||
                    !!(window as any).domAutomation ||
                    !!(window as any).domAutomationController
                );
            },
            weight: 40
        },
        {
            name: "missing_plugins",
            check: () => {
                if (typeof navigator.plugins === "undefined") return true;
                return navigator.plugins.length === 0;
            },
            weight: 20
        }
        // {
        // 	name: "inconsistent_permissions",
        // 	check: async () => {
        // 		try {
        // 			const permissionStatus = await navigator.permissions.query({
        // 				name: "notifications" as PermissionName,
        // 			});
        // 			return false;
        // 		} catch {
        // 			return true; // Probably automated if permissions API doesn't work properly
        // 		}
        // 	},
        // 	weight: 15,
        // },
        // {
        // 	name: "language_inconsistency",
        // 	check: () => {
        // 		const browserLang = navigator.language;
        // 		const systemLang =
        // 			Intl.DateTimeFormat().resolvedOptions().locale;
        // 		return browserLang !== systemLang;
        // 	},
        // 	weight: 10,
        // },
        // {
        // 	name: "screen_inconsistency",
        // 	check: () => {
        // 		return (
        // 			screen.width === 0 ||
        // 			screen.height === 0 ||
        // 			screen.availWidth > screen.width ||
        // 			screen.availHeight > screen.height
        // 		);
        // 	},
        // 	weight: 25,
        // },
    ];

    public static async detect(): Promise<BotDetectionResult> {
        const results: Array<{
            name: string;
            detected: boolean;
            weight: number;
        }> = [];
        let totalScore = 0;

        for (const check of this.checks) {
            try {
                const result = await check.check();
                results.push({
                    name: check.name,
                    detected: result,
                    weight: check.weight
                });

                if (result) {
                    totalScore += check.weight;
                }
            } catch (error) {
                // If a check fails, it might indicate automation
                results.push({
                    name: check.name,
                    detected: true,
                    weight: check.weight * 0.5 // Reduce weight for failed checks
                });
                totalScore += check.weight * 0.5;
            }
        }

        const isBot = totalScore >= 40; // Threshold for bot detection
        const reasons = results.filter((r) => r.detected).map((r) => r.name);

        return {
            isBot,
            reasons,
            score: Math.min(totalScore, 100)
        };
    }

    public static createDetectionHeader(): string {
        // Create a header value that can be sent with requests
        const webdriverPresent = !!(window as any).webdriver;
        const chromeRuntime = !!(window as any).chrome?.runtime;
        const pluginCount = navigator.plugins?.length || 0;

        return btoa(
            JSON.stringify({
                wd: webdriverPresent,
                cr: chromeRuntime,
                pc: pluginCount,
                ts: Date.now()
            })
        );
    }
}
