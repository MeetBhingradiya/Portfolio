import { Options } from "qr-code-styling";
import { ExtensionOptions } from "qr-border-plugin";

interface ITemplate {
    Name: string;
    icon: string;
    description: string;
    Preset: {
        QROptions: Options;
        QRBorderOptionsEnabled: false | boolean;
        QRBorderOptions?: ExtensionOptions;
    }
}

const Templates: ITemplate[] = [

];


export type { ITemplate };
export { Templates };