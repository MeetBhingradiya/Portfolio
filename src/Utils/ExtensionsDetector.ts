/**
 *  @file        Utils\ExtensionsDetector.ts
 *  @description No description available for Utils\ExtensionsDetector.ts.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 12:54 PM IST (Kolkata +5:30 UTC)
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