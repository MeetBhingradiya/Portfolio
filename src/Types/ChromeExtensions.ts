/**
 *  @file        Types\ChromeExtensions.ts
 *  @description No description available for Types\ChromeExtensions.ts.
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