// ? Bookmark Main Page Types
import { v4 } from 'uuid';
import { Config } from '@Config';
import {
    Edit,
    Book,
    Bookmark,
    LocalMall,
    SettingsOutlined,
    LocalMallOutlined,
    BookOutlined,
    BookmarkOutlined,
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

enum ILinkOpenTypes {
    NEW_TAB = "newTab",
    CURRENT_TAB = "currentTab",
    NEW_WINDOW = "newWindow",
    FULL_SCREEN = "fullScreen",
}

interface IBookmark {

    BookmarkID: string
    Name: string
    Description?: string

    Keywords?: string[]

    WebLink: string
    Android?: string
    Windows?: string
    Priority?: "windows" | "android" | "web"

    Icon?: string
    isSVG?: boolean
    fillColor?: string
    CORSProxy?: boolean

    isSponsored: boolean
    isPublished: boolean
    isCloudSync: boolean
    isDefault: boolean
    isAdminOnly: boolean

    isDeleteBlock: boolean
    isEditBlock: boolean
}

const DefualtBookmark: IBookmark = {
    // ? Identifier
    BookmarkID: v4(),
    Name: "New Bookmark",

    // ? URLs
    WebLink: "https://example.com",
    Android: "",
    Windows: "",
    Priority: "web",

    // ? Search Engine
    Description: "",
    Keywords: [],

    // ? Icons Related
    Icon: "",
    isSVG: false,
    fillColor: "#000000",
    CORSProxy: false,

    // ? Admin Options
    isPublished: false,
    isDeleteBlock: false,
    isCloudSync: false,
    isDefault: false,
    isAdminOnly: false,
    isSponsored: false,
    isEditBlock: false
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
    PlateformPriority: "desktop" | "mobile" | "web"
    /**
     * Cloud API Now Automatically Randomize Bookmarks Order that means this setting automatically set to true & it also true even you set it to false
     * @deprecated - Will be removed in v1.2.0
     */
    CloudSyncRandomize?: boolean
    SearchEngine: ISearchEngines
    CloudSync: boolean
    Locale: ILocale
    priorityWindowsApp: boolean
    priorityAndroidapp: boolean
    NotifyYourRequestUpdated: boolean
    ShowLabels: boolean
}

const DefualtPreferences: IPreferences = {
    OpenMethod: ILinkOpenTypes.NEW_TAB,
    PlateformPriority: "web",
    CloudSyncRandomize: false,
    SearchEngine: ISearchEngines.GOOGLE,
    CloudSync: false,
    Locale: ILocale.EN,
    NotifyYourRequestUpdated: false,
    priorityWindowsApp: false,
    priorityAndroidapp: false,
    ShowLabels: true,
}

interface IToolsState {
    FilterBookmarks: Array<IBookmark>
    Bookmarks: Array<IBookmark>
    Query: string
    QueryDisplay: string
    isFirstRun: boolean
    Preferences: IPreferences
}

const DefualtToolsState: IToolsState = {
    FilterBookmarks: [],
    Bookmarks: [],
    Query: "",
    QueryDisplay: "",
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
}

const DefualtToolsSuggestionsState: IToolsSuggestionsState = {
    Suggestions: [],
    Index: 0,
}

enum IToolsSettingsTabs {
    // ? Create & Editors
    Create = "create",
    Edit = "edit",

    Marketplace = "marketplace",
    Preferences = "preferences",

    Contribute = "contribute",
    BeAdmin = "beadmin",

    // ? Admin
    AdminCreate = "admincreate",
    AdminEdit = "adminedit",
    Cloud = "cloud",
}

interface IBookmarkRequest {
    id: string
    bookmark: IBookmark
    createdOn: Date
    approvedOn?: Date
    rejectedOn?: Date
    status: "pending" | "approved" | "rejected"
    rejectedReason?: string
}

const DefualtBookmarkRequest: IBookmarkRequest = {
    id: "",
    bookmark: DefualtBookmark,
    createdOn: new Date(),
    status: "pending",
}

interface IToolsModalData {
    isOpen: boolean
    isMaximized: boolean
    isMinimized: boolean
    type: IToolsSettingsTabs

    newKeyword: string
    MarketPlaceQuery: string

    bookmark: IBookmark
    adminBookmark: IBookmark
    bookmarkRequest: IBookmarkRequest

    isAdminOptionVisible: boolean
    isAdmin: boolean
    isMarketPlaceFetched: boolean
    isRequestsFetched: boolean

    AdminSignature: string
    RemoteBookmarks: Array<IBookmark>
    hasMore: boolean
}

const DefualtToolsModalData: IToolsModalData = {
    isOpen: false,
    isMaximized: false,
    isMinimized: false,
    type: IToolsSettingsTabs.Preferences,

    newKeyword: "",
    MarketPlaceQuery: "",
    bookmark: DefualtBookmark,
    adminBookmark: DefualtBookmark,
    bookmarkRequest: DefualtBookmarkRequest,

    isAdminOptionVisible: false,
    isAdmin: false,
    isMarketPlaceFetched: false,
    isRequestsFetched: false,

    AdminSignature: "",
    RemoteBookmarks: [],
    hasMore: true
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
    DefualtBookmarkRequest,
    DefualtBookmarkContextMenu
}

export type {
    IBookmark,
    IPreferences,
    IToolsState,
    IToolsSuggestionsState,
    IToolsModalData,
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