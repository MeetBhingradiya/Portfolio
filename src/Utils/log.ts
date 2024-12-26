import { Config } from "@Config/index";

export function log(...args: any[]) {
    if (Config.Environment === "Development") {
        console.log(...args);
    }
}