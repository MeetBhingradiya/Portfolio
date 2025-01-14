/**
 *  @FileID          Utils\ExtensionsDetector.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

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