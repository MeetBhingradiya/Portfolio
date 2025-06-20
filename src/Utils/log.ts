import { Config } from "@Config";

export function log(...args: any[]) {
    if (Config.Environment === "development") {
        console.log(...args);
    }
}
