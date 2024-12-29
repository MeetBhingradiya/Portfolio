import { Config } from "@Config/index";

export function log(...args: any[]) {
    if (Config.Environment === "development") {
        console.log(...args);
    }
}