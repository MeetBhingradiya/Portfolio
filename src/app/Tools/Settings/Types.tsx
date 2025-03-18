// ? Bookmark Main Page Types
import { v4 } from 'uuid';
import { Config } from '@Config';
import {
    Add,
    Close,
    Delete,
    Edit,
    Save,
    OpenInNew,
    Settings as SettingsIcon,
    Cloud,
    Restore,
    Book,
    Bookmark,
    Home,
    Circle,
    ScatterPlot,
    Search,
    LocalMall,
    Info,
    SettingsOutlined,
    LocalMallOutlined,
    InfoOutlined,
    BookOutlined,
    BookmarkOutlined,
    DragIndicator,
    Label,
    AddCircle,
    RequestPage,
    AdminPanelSettings,
    BookmarkAdd,
    VerifiedUser,
    VerifiedUserOutlined,
    EditOutlined,
    Settings,
    RequestPageOutlined,
    BookmarkAddOutlined,
    AdminPanelSettingsOutlined
} from '@mui/icons-material';

// ? Bookmark Data
interface IBookmark {
    id?: string
    name: string
    url: string
    description?: string
    keywords?: string[]
    icon?: string
    isSVG?: boolean
    SVGStyles?: {
        fill?: string
    };
    androidapp?: string
    windowsapp?: string
    size?: "128" | "64" | "32" | "16"
    isServer?: boolean
}

const DefualtBookmark: IBookmark = {
    id: v4(),
    name: "",
    url: "",
    description: "",
    keywords: [],
    icon: "",
    isSVG: false,
    SVGStyles: {
        fill: "#000000"
    },
    androidapp: "",
    windowsapp: "",
    size: "128",
    isServer: false,
}

enum ILinkOpenTypes {
    NEW_TAB = "newTab",
    CURRENT_TAB = "currentTab",
    NEW_WINDOW = "newWindow",
    FULL_SCREEN = "fullScreen",
}

enum ISearchEngines {
    GOOGLE = "google",
    BING = "bing",
    DUCKDUCKGO = "duckduckgo",
    BRAVE = "brave",
    QWANT = "qwant",
    YAHOO = "yahoo",
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

interface IPreferences {
    OpenMethod: ILinkOpenTypes
    SearchEngine: ISearchEngines
    CloudSync: boolean
    Locale: ILocale
    priorityWindowsApp: boolean
    priorityAndroidapp: boolean
    NotifyYourRequestUpdated: boolean
}

const DefualtPreferences: IPreferences = {
    OpenMethod: ILinkOpenTypes.NEW_TAB,
    SearchEngine: ISearchEngines.GOOGLE,
    CloudSync: false,
    Locale: ILocale.EN,
    NotifyYourRequestUpdated: false,
    priorityWindowsApp: false,
    priorityAndroidapp: false,
}

interface IToolsState {
    FilterBookmarks: Array<IBookmark>
    Bookmarks: Array<IBookmark>
    Query: string
    isFirstRun: boolean
    Preferences: IPreferences
}

const DefualtToolsState: IToolsState = {
    FilterBookmarks: [],
    Bookmarks: [],
    Query: "",
    isFirstRun: true,
    Preferences: DefualtPreferences,
}

interface IToolsSuggestion {
    Query: string
    Thumbnail?: string
    Keywords?: Array<string>
    Description?: string
}

interface IToolsSuggestionParams {
    q: string
    l: ILocale
    with: ISearchEngines
}

interface IToolsSuggestionResponse {
    text: string
    desc?: string
    image?: string
}

interface IToolsSuggestionsState {
    Suggestions: Array<IToolsSuggestion>
    Index: number
    QueryDisplay: "",
}

const DefualtToolsSuggestionsState: IToolsSuggestionsState = {
    Suggestions: [],
    Index: 0,
    QueryDisplay: "",
}

enum IToolsSettingsTabs {
    // ? Create & Editors
    Create = "create",
    Edit = "edit",

    Marketplace = "marketplace",
    Preferences = "preferences",

    RequestBookmark = "requestBookmark",
    BeAdmin = "beadmin",

    // ? Admin
    AdminCreate = "admincreate",
    AdminEdit = "adminedit",
    Requests = "requests",
    Bookmarks = "bookmarks",
}

const ToolsSettingsTabsMenu = {
    [IToolsSettingsTabs.Create]: {
        Active: <Book />,
        Inactive: <BookOutlined />,
        Title: "Add New Bookmark",
        Tab: "Create Bookmark",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.Edit]: {
        Active: <Edit />,
        Inactive: <EditOutlined />,
        Title: "Edit Bookmark",
        Tab: "Edit Bookmark",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.Marketplace]: {
        Active: <LocalMall />,
        Inactive: <LocalMallOutlined />,
        Title: "Marketplace",
        Tab: "Marketplace",
        Class: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.Preferences]: {
        Active: <Settings />,
        Inactive: <SettingsOutlined />,
        Title: "Preferences",
        Tab: "Preferences",
        Class: "flex flex-col gap-3 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.RequestBookmark]: {
        Active: <RequestPage />,
        Inactive: <RequestPageOutlined />,
        Title: "Request Bookmark",
        Tab: "Request Bookmark",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.BeAdmin]: {
        Active: <VerifiedUser />,
        Inactive: <VerifiedUserOutlined />,
        Title: "Be Admin",
        Tab: "Be Admin",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.AdminCreate]: {
        Active: <BookmarkAdd />,
        Inactive: <BookmarkAddOutlined />,
        Title: "Add New Bookmark - Admin",
        Tab: "Create Bookmark - Admin",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.AdminEdit]: {
        Active: <AdminPanelSettings />,
        Inactive: <AdminPanelSettingsOutlined />,
        Title: "Edit Bookmark - Admin",
        Tab: "Edit Bookmark - Admin",
        Class: "flex flex-row md:flex-col gap-1 px-2 py-16 HideScrollbars"
    },
    [IToolsSettingsTabs.Requests]: {
        Active: <RequestPage />,
        Inactive: <RequestPageOutlined />,
        Title: "Requests",
        Tab: "Requests",
        Class: ""
    },
    [IToolsSettingsTabs.Bookmarks]: {
        Active: <Bookmark />,
        Inactive: <BookmarkOutlined />,
        Title: "Bookmarks",
        Tab: "Bookmarks",
        Class: ""
    }
}

interface IServerBookmarks {
    BookmarkID: string
    name: string
    url: string
    windowsapp?: string
    androidapp?: string
    icon?: string
    isSVGSrc?: boolean
    SVGStyles?: {
        fill?: string
    }
    description?: string
    keywords?: Array<string>
    size?: "128" | "64" | "32" | "16"
    isPublished: boolean
    isDeleted: boolean
}

const DefualtServerBookmarks: IServerBookmarks = {
    BookmarkID: "",
    name: "",
    url: "",
    isPublished: false,
    isDeleted: false,
    windowsapp: "",
    androidapp: "",
    icon: "",
    isSVGSrc: false,
    SVGStyles: {
        fill: "#000000"
    },
    description: "",
    keywords: [],
    size: "128",
}

interface IBookmarkRequest {
    id: string
    bookmark: IServerBookmarks
    createdOn: Date
    approvedOn?: Date
    rejectedOn?: Date
    status: "pending" | "approved" | "rejected"
    rejectedReason?: string
}

const DefualtBookmarkRequest: IBookmarkRequest = {
    id: "",
    bookmark: DefualtServerBookmarks,
    createdOn: new Date(),
    status: "pending",
}

interface IToolsModalData {
    isOpen: boolean
    isMaximized: boolean
    isMinimized: boolean
    type: IToolsSettingsTabs

    bookmark: IBookmark
    adminBookmark: IBookmark
    bookmarkRequest: IBookmarkRequest

    isAdminOptionVisible: boolean
    isAdmin: boolean
    isMarketPlaceFetched: boolean
    isRequestsFetched: boolean
    
    AdminSignature: string
    RemoteBookmarks: Array<IBookmark>
    Requests: Array<IBookmarkRequest>
}

const DefualtToolsModalData: IToolsModalData = {
    isOpen: false,
    isMaximized: false,
    isMinimized: false,
    type: IToolsSettingsTabs.Preferences,

    bookmark: DefualtBookmark,
    adminBookmark: DefualtBookmark,
    bookmarkRequest: DefualtBookmarkRequest,

    isAdminOptionVisible: false,
    isAdmin: false,
    isMarketPlaceFetched: false,
    isRequestsFetched: false,

    AdminSignature: "",
    RemoteBookmarks: [],
    Requests: [],
}

const SearchEnginePresets = {
    google: `https://www.google.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    bing: `https://www.bing.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    duckduckgo: `https://duckduckgo.com/?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    brave: `https://search.brave.com/search?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    qwant: `https://www.qwant.com/?q=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
    yahoo: `https://search.yahoo.com/search?p=@Query&utm_source=${Config.WhiteListedDomains[0]}`,
}

const ToolsAPIS = {
    Suggestions: `https://api.suggestions.victr.me/`
}

interface IBookmarkContextMenuObject {
    mouseX: number
    mouseY: number
    ItemID: string
}

type IBookmarkContextMenu = IBookmarkContextMenuObject | null

const DefualtBookmarkContextMenu: IBookmarkContextMenu = null

export {
    DefualtBookmark,
    DefualtPreferences,
    DefualtToolsState,
    DefualtToolsSuggestionsState,
    DefualtToolsModalData,
    SearchEnginePresets,
    ToolsAPIS,
    ToolsSettingsTabsMenu,
    DefualtServerBookmarks,
    DefualtBookmarkRequest,
    DefualtBookmarkContextMenu
}

export type {
    IBookmark,
    IPreferences,
    IToolsState,
    IToolsSuggestionsState,
    IToolsModalData,
    IServerBookmarks,
    IBookmarkRequest,
    IBookmarkContextMenu
}

export {
    ILocale,
    ISearchEngines,
    ILinkOpenTypes,
    IToolsSettingsTabs
}

export type {
    IToolsSuggestionParams,
    IToolsSuggestionResponse,
    IToolsSuggestion
}