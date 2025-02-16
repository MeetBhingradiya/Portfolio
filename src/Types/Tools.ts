/**
 *  @FileID          Types\Tools.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.9
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 16/02/25 10:40 AM IST (Kolkata +5:30 UTC)
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

    // ? Advanced Data
    windowsapp?: string
    androidapp?: string
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
    Keywords?: Array<string>
    Description?: string
}

interface IState {
    FilterBookmarks: Array<IBookmark>
    Bookmarks: Array<IBookmark>
    Query: string
    QueryDisplay: string
    Settings: {
        isFirstRun: boolean
        isNewTab: boolean
        SearchEngine: ISearchEngine
        Locale: string
        CloudSync: boolean

        isNewWindow?: boolean
        priorityWindowsApp?: boolean
        priorityAndroidapp?: boolean
        CloudSyncRandomize?: boolean
    }
}

enum ModelType {
    // ? Not Dismisable 
    Edit = "edit",
    Create = "create",

    // ? Core Models
    Settings = "settings",
    Marketplace = "marketplace",
    About = "about",

    // ? Only for Admins
    Requests = "requests",
    Unpublished = "unpublished",
    Modify = "modify"
}

interface SettingsProps {
    isOpen: boolean
    onClose: () => void
    type: ModelType
    SwitchModelType: (type: ModelType) => void

    State: IState
    Dispatch: React.Dispatch<React.SetStateAction<IState>>

    EditBookmarkData?: IBookmark
}

interface SettingsState {
    New_Bookmark: IBookmark
    Search_Settings_Query: string
    MarketPlace: {
        Remote_Bookmarks: Array<IBookmark>
        Serch_Bookmarks_Query: string
        isFetched: boolean
    }
}

export {
    ISearchEngine,
    ILocale,
    ModelType
}

export type {
    IBookmark,
    ISuggestionPrams,
    ISuggestionResponse,
    ISuggestion,
    IState,
    SettingsProps,
    SettingsState
}