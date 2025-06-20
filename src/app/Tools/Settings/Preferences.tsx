import React from "react";
import {
    IToolsModalData,
    IToolsState,
    ISearchEngines,
    ILinkOpenTypes,
    ILocale
} from "./Types";
import {
    Card,
    Select,
    SelectItem,
    Divider,
    Button,
    Tooltip
} from "@heroui/react";
import {
    CardContent,
    FormControlLabel,
    Switch,
    Typography
} from "@mui/material";
import {
    Android,
    Window,
    Language,
    CloudSync,
    CloudOff,
    Search,
    Google,
    Public,
    Explore,
    AutoFixHigh,
    Settings
} from "@mui/icons-material";

interface PreferencesProps {
    State: IToolsState;
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>;
    ModalState: IToolsModalData;
}

function Preferences({ State, Dispatch, ModalState }: PreferencesProps) {
    const handlePreferenceChange = (key: string, value: any) => {
        Dispatch((prevState) => ({
            ...prevState,
            Preferences: {
                ...prevState.Preferences,
                [key]: value
            }
        }));
    };

    // Search engine options with their icons
    const searchEngineOptions = [
        {
            value: ISearchEngines.GOOGLE,
            label: "Google",
            icon: (
                <img
                    src="https://www.google.com/favicon.ico"
                    width={20}
                    height={20}
                    alt="Google"
                />
            )
        },
        {
            value: ISearchEngines.BING,
            label: "Bing",
            icon: (
                <img
                    src="https://www.bing.com/favicon.ico"
                    width={20}
                    height={20}
                    alt="Bing"
                />
            )
        },
        {
            value: ISearchEngines.DUCKDUCKGO,
            label: "DuckDuckGo",
            icon: (
                <img
                    src="https://duckduckgo.com/favicon.ico"
                    width={20}
                    height={20}
                    alt="DuckDuckGo"
                />
            )
        },
        {
            value: ISearchEngines.QWANT,
            label: "Qwant",
            icon: (
                <img
                    src="https://www.qwant.com/favicon.ico"
                    width={20}
                    height={20}
                    alt="Qwant"
                />
            )
        },
        {
            value: ISearchEngines.YAHOO,
            label: "Yahoo",
            icon: (
                <img
                    src="https://search.yahoo.com/favicon.ico"
                    width={20}
                    height={20}
                    alt="Yahoo"
                />
            )
        }
    ];

    const linkOpenOptions = [
        {
            value: ILinkOpenTypes.NEW_TAB,
            label: "New Tab",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}>
                    <path
                        fill="currentColor"
                        d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z"
                    />
                </svg>
            )
        },
        {
            value: ILinkOpenTypes.CURRENT_TAB,
            label: "Current Tab",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}>
                    <path
                        fill="currentColor"
                        d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z"
                    />
                </svg>
            )
        },
        {
            value: ILinkOpenTypes.NEW_WINDOW,
            label: "New Window",
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    width={20}
                    height={20}>
                    <path
                        fill="currentColor"
                        d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 12c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm-6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0-6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm4-8c0 1.1.9 2 2 2s2-.9 2-2s-.9-2-2-2s-2 .9-2 2zm-4 2c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2z"
                    />
                </svg>
            )
        }
        // { value: ILinkOpenTypes.FULL_SCREEN, label: "Full Screen", icon: <svg viewBox="0 0 24 24" width={20} height={20}><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg> },
    ];

    const PlateformPriorityOptions = [
        {
            value: "web",
            label: "Web",
            icon: (
                <Language
                    className={`w-8 h-8 ${
                        State.Preferences.PlateformPriority === "web"
                            ? "text-primary"
                            : "text-gray-400"
                    }`}
                />
            ),
            description: "Open in browser"
        },
        {
            value: "mobile",
            label: "Mobile",
            icon: (
                <Android
                    className={`w-8 h-8 ${
                        State.Preferences.PlateformPriority === "mobile"
                            ? "text-primary"
                            : "text-gray-400"
                    }`}
                />
            ),
            description: "Prefer Android app"
        },
        {
            value: "desktop",
            label: "Desktop",
            icon: (
                <Window
                    className={`w-8 h-8 ${
                        State.Preferences.PlateformPriority === "desktop"
                            ? "text-primary"
                            : "text-gray-400"
                    }`}
                />
            ),
            description: "Prefer Windows app"
        }
    ];

    return (
        <div className="flex flex-col gap-6 w-full mx-auto">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography
                    variant="h1"
                    className="font-bold text-6xl">
                    <Settings fontSize="inherit" />
                </Typography>
                <Typography
                    variant="h4"
                    className="font-bold text-lg">
                    Preferences
                </Typography>
                <Typography
                    variant="body1"
                    className="text-gray-500 text-sm">
                    Customize your new tab experience
                </Typography>
            </div>

            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Search className="text-primary" />
                Search Engine
            </h2>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Default Search Engine</p>
                    <p className="text-xs text-gray-500 mb-2">
                        Select which search engine to use when searching
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                        {searchEngineOptions.map((engine) => (
                            <div
                                key={engine.value}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    State.Preferences.SearchEngine ===
                                    engine.value
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                                onClick={() =>
                                    handlePreferenceChange(
                                        "SearchEngine",
                                        engine.value
                                    )
                                }>
                                {engine.icon}
                                {/* <span className="text-sm">{engine.label}</span> */}
                            </div>
                        ))}
                    </div>
                </div>

                <Divider className="my-2" />

                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Local Suggestions</p>
                    <p className="text-xs text-gray-500 mb-2">
                        When enabled, suggestions will be generated locally from
                        your bookmarks
                    </p>
                    <Select
                        label="Local Suggestions"
                        placeholder="Select What Kind of Suggestions Language You Want"
                        className="w-full"
                        defaultSelectedKeys={[State.Preferences.Locale]}
                        onChange={(e) =>
                            handlePreferenceChange("Locale", e.target.value)
                        }>
                        {Object.entries(ILocale).map(([key, value]) => (
                            <SelectItem key={value}>{key}</SelectItem>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Link Opening Preferences */}
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Explore className="text-primary" />
                Where to Open Links ?
            </h2>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">
                        Default Link Opening Method
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                        Choose how links should open by default
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {linkOpenOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    State.Preferences.OpenMethod ===
                                    option.value
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                                onClick={() =>
                                    handlePreferenceChange(
                                        "OpenMethod",
                                        option.value
                                    )
                                }>
                                {option.icon}
                                <span className="text-sm">{option.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                        this is an fallback option if bookmark not contains
                        desktop or mobile app links
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                        <span className="text-blue-500 font-semibold">
                            Tip:
                        </span>{" "}
                        Using &quot;New Window&quot; you can use Websites as
                        Webapps. URL/address bar still visible for your Security
                    </p>
                </div>

                <Divider className="my-2" />

                <div className="flex flex-col gap-2 mt-2">
                    <p className="text-sm font-medium">Platform Priority</p>
                    <p className="text-xs text-gray-500 mb-2">
                        Select which platform to prioritize when opening links
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {PlateformPriorityOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    State.Preferences.PlateformPriority ===
                                    option.value
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10"
                                        : "border-gray-200 dark:border-gray-700"
                                }`}
                                onClick={() =>
                                    handlePreferenceChange(
                                        "PlateformPriority",
                                        option.value
                                    )
                                }>
                                <div className="flex items-center justify-center">
                                    {option.icon}
                                </div>
                                <div className="text-center">
                                    <p
                                        className={`font-medium ${
                                            State.Preferences
                                                .PlateformPriority ===
                                            option.value
                                                ? "text-primary"
                                                : ""
                                        }`}>
                                        {option.label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {option.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                        <span className="text-yellow-500 font-semibold">
                            Note:
                        </span>{" "}
                        Changing this option will change the default behavior of
                        the bookmark system. You can still open links in a
                        different platform by using the context menu or the
                        right-click menu.
                    </p>
                </div>

                <Divider className="my-2" />

                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium">Platform Visibility</p>
                    <p className="text-xs text-gray-500 mb-2">
                        Context menu options for Android (Mobile) and Windows
                        (Desktop) apps
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={
                                        State.Preferences.priorityAndroidapp ||
                                        false
                                    }
                                    onChange={(e) =>
                                        handlePreferenceChange(
                                            "priorityAndroidapp",
                                            e.target.checked
                                        )
                                    }
                                    color="primary"
                                />
                            }
                            label={
                                <div className="flex items-center gap-2">
                                    <Android className="text-primary" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            Show Android Links
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Display Android app options when
                                            available
                                        </span>
                                    </div>
                                </div>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={
                                        State.Preferences.priorityWindowsApp ||
                                        false
                                    }
                                    onChange={(e) =>
                                        handlePreferenceChange(
                                            "priorityWindowsApp",
                                            e.target.checked
                                        )
                                    }
                                    color="primary"
                                />
                            }
                            label={
                                <div className="flex items-center gap-2">
                                    <Window className="text-primary" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            Show Windows Links
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Display Windows app options when
                                            available
                                        </span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                    <span className="text-red-500 font-semibold">Note:</span>{" "}
                    Mac & IOS are never be supported even if you requested to
                    us. Linux is not supported yet. We are working on it.
                </p>
            </div>

            {/* Cloud Sync Preferences */}
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <CloudSync className="text-primary" />
                Cloud Auto Updates
            </h2>
            <div className="flex flex-col gap-4">
                <div
                    className={`flex items-center gap-3 p-4 rounded-lg ${State.Preferences.CloudSync ? "bg-primary-50 dark:bg-primary-900/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                    {State.Preferences.CloudSync ? (
                        <CloudSync
                            className="text-primary"
                            fontSize="large"
                        />
                    ) : (
                        <CloudOff
                            className="text-gray-500"
                            fontSize="large"
                        />
                    )}
                    <div>
                        <h3 className="font-medium">
                            {State.Preferences.CloudSync
                                ? "Cloud Sync Enabled"
                                : "Cloud Sync Disabled"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {State.Preferences.CloudSync
                                ? "Bookmarks will Automatically updates on your device every time when you go online"
                                : "Bookmarks will not be updated on your device until you go online"}
                        </p>
                    </div>
                </div>

                <FormControlLabel
                    control={
                        <Switch
                            checked={State.Preferences.CloudSync || false}
                            onChange={(e) =>
                                handlePreferenceChange(
                                    "CloudSync",
                                    e.target.checked
                                )
                            }
                            color="primary"
                        />
                    }
                    label={
                        <div className="flex flex-col">
                            <span className="font-medium">
                                Enable Cloud Sync
                            </span>
                            <span className="text-xs text-gray-500">
                                Sync bookmarks across the cloud updates
                                automatically
                            </span>
                        </div>
                    }
                />
            </div>

            {/* Show Labels */}
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <AutoFixHigh className="text-primary" />
                Labels
            </h2>
            <div className="flex flex-col gap-4">
                <FormControlLabel
                    control={
                        <Switch
                            checked={State.Preferences.ShowLabels || false}
                            onChange={(e) =>
                                handlePreferenceChange(
                                    "ShowLabels",
                                    e.target.checked
                                )
                            }
                            color="primary"
                        />
                    }
                    label={
                        <div className="flex flex-col">
                            <span className="font-medium">Show Labels</span>
                            <span className="text-xs text-gray-500">
                                Display labels on bookmarks for easier
                                identification of Webapp or Site
                            </span>
                        </div>
                    }
                />
            </div>

            {/* <div className="flex flex-col gap-2 mt-2 mb-6">
                <p className="text-sm text-gray-500">
                    These preferences affect how the bookmark system works across your account. Changes are saved automatically.
                </p>
            </div> */}
        </div>
    );
}

export default Preferences;
