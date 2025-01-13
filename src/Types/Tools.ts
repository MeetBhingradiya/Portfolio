/**
 *  @file        Types\Tools.ts
 *  @description No description available for Types\Tools.ts.
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

interface IBookmark {
    // ? Unique identifier for the bookmark
    id?: string

    // ? Site Name if given by the user otherwise fetched from Site URL
    name: string

    // ? Site URL
    url: string

    // ? Site Icon
    icon?: string

    // ? Site Icon as SVG
    isSVGSrc?: boolean
    SVGStyles?: {
        fill?: string
    }

    // ? Site Description if given by the user or fetched from meta tags of the site
    description?: string

    // ? Site Keywords if given by the user or fetched from meta tags of the site
    keywords?: Array<string>

    // ? Defualt Icon Size
    size?: "128" | "64" | "32" | "16"

    isServer?: boolean
}

enum ILocale {
    EN = "en",
    FR = "fr",
    ES = "es",
    DE = "de",
    IT = "it",
    PT = "pt",
    RU = "ru",
    JA = "ja",
    ZH = "zh",
    AR = "ar",
    HI = "hi",
    BN = "bn",
    TE = "te",
    TA = "ta",
    KN = "kn",
    UR = "ur",
    FA = "fa",
    TR = "tr",
    NL = "nl",
    SV = "sv",
    NO = "no",
    FI = "fi",
    DA = "da",
    PL = "pl",
    ID = "id",
    MS = "ms",
    TH = "th",
    VI = "vi",
    KO = "ko",
    HE = "he",
    EL = "el",
    HU = "hu",
    CS = "cs",
    SK = "sk",
    UK = "uk",
    BG = "bg",
    HR = "hr",
    SR = "sr",
    SL = "sl",
    RO = "ro",
    LT = "lt",
    LV = "lv",
    ET = "et",
    MT = "mt",
    IS = "is",
    GA = "ga",
    EU = "eu",
    SQ = "sq",
    MK = "mk",
    HY = "hy",
    UZ = "uz",
    KK = "kk",
    KY = "ky",
    TK = "tk",
    MN = "mn",
    AM = "am",
    GE = "ge",
    KA = "ka",
    KZ = "kz",
    AZ = "az"
}

enum ISearchEngine {
    GOOGLE = "google",
    BING = "bing",
    DUCKDUCKGO = "duckduckgo",
    BRAVE = "brave",
    QWANT = "qwant",
    YAHOO = "yahoo",
}

interface ISuggestionPrams {
    q: string
    l: ILocale
    with: ISearchEngine
}

interface ISuggestionResponse {
    text: string
    desc?: string
    image?: string
}

interface ISuggestion {
    Query: string
    Thumbnail?: string
    Link: string
    Keywords?: Array<string>
}

interface IState {
    FilterSuggestions: Array<ISuggestion>
    FilterBookmarks: Array<IBookmark>
    Bookmarks: Array<IBookmark>
    Suggestions: Array<ISuggestionResponse>
    Query: string
    Settings: {
        isFirstRun: boolean
        isNewTab: boolean
        RandomizeLinks: boolean
        SearchEngine: ISearchEngine
        Locale: string
        CloudSync: boolean
        windowWidth?: number
    }
}

export {
    ISearchEngine,
    ILocale
}

export type {
    IBookmark,
    ISuggestionPrams,
    ISuggestionResponse,
    ISuggestion,
    IState
}