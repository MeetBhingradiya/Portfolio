/**
 *  @FileID          Types\ChromeExtensions.ts
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

interface IExtensions {
    Name: string
    ID: string
    Icon: string
    Settings: {
        // ? If this Extension is installed then Application will Stop
        isBlocked: boolean

        // ? If this Extension is installed then Application will show a Warning
        isWarning: boolean

        // ? Status of Extension
        Flag: "Installed" | "NInstalled"
    }

    // ? Endpoits of Content Scripts or Images for Flag as Installed or Not Installed
    Files: Array<string>

}

interface IState {
    Extensions: Array<IExtensions>
    isBlocked: boolean
    isWarning: boolean
    FlaggedExtensions: Array<IExtensions>
}

export type { 
    IExtensions, 
    IState 
}