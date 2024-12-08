import type {
    IState,
    IExtensions
} from "@Types/ChromeExtensions"
import { ExtensionsDB } from "@Data/ExtensionsDB"
import axios from "axios"

function ExtensionsDetector(): IState {
    const state: IState = {
        Extensions: [],
        isBlocked: false,
        isWarning: false,
        FlaggedExtensions: []
    }

    const extensions: Array<IExtensions> = ExtensionsDB

    extensions.forEach((extension: IExtensions) => {
        const { ID, Files, Settings } = extension
        const { isBlocked, isWarning, Flag } = Settings

        const isInstalled: boolean = Files.some((file: string) => {
            const url: string = `chrome-extension://${ID}/${file}`
            return axios.get(url)
                .then(() => true)
                .catch(() => false)
        })

        if (isInstalled) {
            if (isBlocked) {
                state.isBlocked = true
            } else if (isWarning) {
                state.isWarning = true
            }

            extension.Settings.Flag = "Installed"
            state.FlaggedExtensions.push(extension)
        } else {
            extension.Settings.Flag = "NInstalled"
        }

        state.Extensions.push(extension)
    })

    return state
}

export { ExtensionsDetector }