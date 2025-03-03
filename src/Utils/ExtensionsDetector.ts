/**
 *  @FileID          Utils\ExtensionsDetector.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:12 AM IST (Kolkata +5:30 UTC)
 */


import type {
    IState,
    IExtensions
} from "@Types/ChromeExtensions"
// import { ExtensionsDB } from "@Data/ExtensionsDB"
import axios from "axios"

/**
 * Detects the installation statuses of Chrome extensions and updates the state accordingly.
 *
 * This function initializes a state object with default values and processes an array of extensions. 
 * For each extension, it attempts to verify installation by checking if any of its files are accessible via HTTP GET requests.
 * If accessible, the extension's settings flag is updated to "Installed" and the extension is added to the flagged list;
 * otherwise, its flag is set to "NInstalled". The state is also updated to reflect if any installed extension is marked as blocked or warning.
 *
 * @returns The updated state object containing the list of all processed extensions, flagged extensions,
 *          and status flags indicating if any extension is blocked or marked with a warning.
 */
function ExtensionsDetector(): IState {
    const state: IState = {
        Extensions: [],
        isBlocked: false,
        isWarning: false,
        FlaggedExtensions: []
    }

    const extensions: Array<IExtensions> = []

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