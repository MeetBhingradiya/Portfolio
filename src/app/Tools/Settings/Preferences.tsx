import React from "react";
import { 
    IToolsModalData, 
    IToolsState, 
    ISearchEngines, 
    ILinkOpenTypes 
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
import { Axios } from "@Utils/Axios";
import { toast } from "react-toastify";

interface PreferencesProps {
    State: IToolsState;
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>;
    ModalState: IToolsModalData;
}

function Preferences({ State, Dispatch, ModalState }: PreferencesProps) {
    // Handler for changing preferences
    const handlePreferenceChange = (key: string, value: any) => {
        Dispatch(prevState => ({
            ...prevState,
            Preferences: {
                ...prevState.Preferences,
                [key]: value
            }
        }));
    };

    // Search engine options with their icons
    const searchEngineOptions = [
        { value: ISearchEngines.GOOGLE, label: "Google", icon: <img src="https://www.google.com/favicon.ico" width={20} height={20} alt="Google" /> },
        { value: ISearchEngines.BING, label: "Bing", icon: <img src="https://www.bing.com/favicon.ico" width={20} height={20} alt="Bing" /> },
        { value: ISearchEngines.DUCKDUCKGO, label: "DuckDuckGo", icon: <img src="https://duckduckgo.com/favicon.ico" width={20} height={20} alt="DuckDuckGo" /> },
        // { value: ISearchEngines.BRAVE, label: "Brave", icon: <img src="https://search.brave.com/favicon.ico" width={20} height={20} alt="Brave" /> },
        { value: ISearchEngines.QWANT, label: "Qwant", icon: <img src="https://www.qwant.com/favicon.ico" width={20} height={20} alt="Qwant" /> },
        { value: ISearchEngines.YAHOO, label: "Yahoo", icon: <img src="https://search.yahoo.com/favicon.ico" width={20} height={20} alt="Yahoo" /> },
    ];

    // Link open methods with their icons
    const linkOpenOptions = [
        { value: ILinkOpenTypes.NEW_TAB, label: "New Tab", icon: <svg viewBox="0 0 24 24" width={20} height={20}><path fill="currentColor" d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
        { value: ILinkOpenTypes.CURRENT_TAB, label: "Current Tab", icon: <svg viewBox="0 0 24 24" width={20} height={20}><path fill="currentColor" d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3h-7z"/></svg> },
        { value: ILinkOpenTypes.NEW_WINDOW, label: "New Window", icon: <svg viewBox="0 0 24 24" width={20} height={20}><path fill="currentColor" d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 12c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm-6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0-6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 0c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm4-8c0 1.1.9 2 2 2s2-.9 2-2s-.9-2-2-2s-2 .9-2 2zm-4 2c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm6 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2zm0 6c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2z"/></svg> },
        { value: ILinkOpenTypes.FULL_SCREEN, label: "Full Screen", icon: <svg viewBox="0 0 24 24" width={20} height={20}><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg> },
    ];

    return (
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography variant="h1" className="font-bold text-6xl">
                    <Settings fontSize="inherit" />
                </Typography>
                <Typography variant="h4" className="font-bold text-lg">
                    Preferences
                </Typography>
                <Typography variant="body1" className="text-gray-500 text-sm">
                    Customize your new tab experience
                </Typography>
            </div>

            {/* Search Engine Preferences */}
            <Card className="w-full">
                <CardContent className="p-5">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Search className="text-primary" />
                        Search Engine Preferences
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Default Search Engine</p>
                            <p className="text-xs text-gray-500 mb-2">Select which search engine to use when searching</p>
                            <Select
                                label="Search Engine"
                                placeholder="Select a search engine"
                                className="w-full"
                                defaultSelectedKeys={[State.Preferences.SearchEngine]}
                                onChange={(e) => handlePreferenceChange("SearchEngine", e.target.value)}
                            >
                                {searchEngineOptions.map((engine) => (
                                    <SelectItem 
                                        key={engine.value} 
                                        startContent={engine.icon}
                                    >
                                        {engine.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Local Suggestions</p>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={State.Preferences.CloudSyncRandomize || false}
                                        onChange={(e) => handlePreferenceChange("CloudSyncRandomize", e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={
                                    <div className="flex flex-col">
                                        <span className="font-medium">Enable Local Suggestions</span>
                                        <span className="text-xs text-gray-500">
                                            When enabled, suggestions will be generated locally from your bookmarks
                                        </span>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Link Opening Preferences */}
            <Card className="w-full">
                <CardContent className="p-5">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <Explore className="text-primary" />
                        Link & Platform Preferences
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Default Link Opening Method</p>
                            <p className="text-xs text-gray-500 mb-2">Choose how links should open by default</p>
                            <Select
                                label="Open Links In"
                                placeholder="Select how links should open"
                                className="w-full"
                                defaultSelectedKeys={[State.Preferences.OpenMethod]}
                                onChange={(e) => handlePreferenceChange("OpenMethod", e.target.value)}
                            >
                                {linkOpenOptions.map((option) => (
                                    <SelectItem 
                                        key={option.value} 
                                        startContent={option.icon}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                            <p className="text-sm font-medium">Platform Priority</p>
                            <p className="text-xs text-gray-500 mb-2">Select which platform to prioritize when opening links</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div 
                                    className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        State.Preferences.PlateformPriority === "web" 
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10" 
                                        : "border-gray-200 dark:border-gray-700"
                                    }`}
                                    onClick={() => handlePreferenceChange("PlateformPriority", "web")}
                                >
                                    <div className="flex items-center justify-center">
                                        <Language className={`w-8 h-8 ${
                                            State.Preferences.PlateformPriority === "web"
                                            ? "text-primary"
                                            : "text-gray-400"
                                        }`} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-medium ${
                                            State.Preferences.PlateformPriority === "web"
                                            ? "text-primary"
                                            : ""
                                        }`}>Web</p>
                                        <p className="text-xs text-gray-500">Open in browser</p>
                                    </div>
                                </div>
                                
                                <div 
                                    className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        State.Preferences.PlateformPriority === "mobile" 
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10" 
                                        : "border-gray-200 dark:border-gray-700"
                                    }`}
                                    onClick={() => handlePreferenceChange("PlateformPriority", "mobile")}
                                >
                                    <div className="flex items-center justify-center">
                                        <Android className={`w-8 h-8 ${
                                            State.Preferences.PlateformPriority === "mobile"
                                            ? "text-primary"
                                            : "text-gray-400"
                                        }`} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-medium ${
                                            State.Preferences.PlateformPriority === "mobile"
                                            ? "text-primary"
                                            : ""
                                        }`}>Mobile</p>
                                        <p className="text-xs text-gray-500">Prefer Android app</p>
                                    </div>
                                </div>
                                
                                <div 
                                    className={`flex flex-col gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        State.Preferences.PlateformPriority === "desktop" 
                                        ? "border-primary bg-primary-50 dark:bg-primary-900/10" 
                                        : "border-gray-200 dark:border-gray-700"
                                    }`}
                                    onClick={() => handlePreferenceChange("PlateformPriority", "desktop")}
                                >
                                    <div className="flex items-center justify-center">
                                        <Window className={`w-8 h-8 ${
                                            State.Preferences.PlateformPriority === "desktop"
                                            ? "text-primary"
                                            : "text-gray-400"
                                        }`} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-medium ${
                                            State.Preferences.PlateformPriority === "desktop"
                                            ? "text-primary"
                                            : ""
                                        }`}>Desktop</p>
                                        <p className="text-xs text-gray-500">Prefer Windows app</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Divider className="my-2" />

                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium">Platform Visibility</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={State.Preferences.priorityAndroidapp || false}
                                            onChange={(e) => handlePreferenceChange("priorityAndroidapp", e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Android className="text-primary" />
                                            <div className="flex flex-col">
                                                <span className="font-medium">Show Android Links</span>
                                                <span className="text-xs text-gray-500">
                                                    Display Android app options when available
                                                </span>
                                            </div>
                                        </div>
                                    }
                                />
                                
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={State.Preferences.priorityWindowsApp || false}
                                            onChange={(e) => handlePreferenceChange("priorityWindowsApp", e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <div className="flex items-center gap-2">
                                            <Window className="text-primary" />
                                            <div className="flex flex-col">
                                                <span className="font-medium">Show Windows Links</span>
                                                <span className="text-xs text-gray-500">
                                                    Display Windows app options when available
                                                </span>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Cloud Sync Preferences */}
            <Card className="w-full">
                <CardContent className="p-5">
                    <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                        <CloudSync className="text-primary" />
                        Cloud Synchronization
                    </h2>
                    <div className="flex flex-col gap-4">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={State.Preferences.CloudSync || false}
                                    onChange={(e) => handlePreferenceChange("CloudSync", e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <div className="flex flex-col">
                                    <span className="font-medium">Enable Cloud Sync</span>
                                    <span className="text-xs text-gray-500">
                                        Sync your bookmarks across devices and import from server when available
                                    </span>
                                </div>
                            }
                        />

                        <div className={`flex items-center gap-3 p-4 rounded-lg ${State.Preferences.CloudSync ? "bg-primary-50 dark:bg-primary-900/20" : "bg-gray-100 dark:bg-gray-800"}`}>
                            {State.Preferences.CloudSync ? (
                                <CloudSync className="text-primary" fontSize="large" />
                            ) : (
                                <CloudOff className="text-gray-500" fontSize="large" />
                            )}
                            <div>
                                <h3 className="font-medium">
                                    {State.Preferences.CloudSync ? "Cloud Sync Enabled" : "Cloud Sync Disabled"}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {State.Preferences.CloudSync 
                                        ? "Your bookmarks will be synced across all your devices" 
                                        : "Enable cloud sync to keep your bookmarks in sync across devices"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-2 mt-2 mb-6">
                <p className="text-sm text-gray-500">
                    These preferences affect how the bookmark system works across your account. Changes are saved automatically.
                </p>
            </div>

            {/* Migration Tool - TEMPORARY */}
            {ModalState?.isAdmin && (
                <Card className="w-full border-2 border-amber-500">
                    <CardContent className="p-5">
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-amber-600">
                            <AutoFixHigh className="text-amber-600" />
                            Database Migration Tool
                        </h2>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                This is a temporary tool to migrate your old bookmark format to the new one.
                                This operation will update your database and can&apos;t be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Migrate Bookmarks</p>
                                <p className="text-xs text-gray-500">Convert old bookmark format to new format</p>
                            </div>
                            <Button 
                                color="warning"
                                variant="solid"
                                startContent={<AutoFixHigh />}
                                onPress={async () => {
                                    try {
                                        // Show loading toast
                                        const loadingToast = toast.loading("Migrating bookmarks...");
                                        
                                        // Call migration endpoint
                                        const response = await Axios.post('/api/bookmarks/migrate', {}, {
                                            headers: {
                                                "x-admin-signature": ModalState.AdminSignature
                                            }
                                        });
                                        
                                        // Update toast based on result
                                        if (response.data.Status === 1) {
                                            toast.update(loadingToast, {
                                                render: `Migration complete: ${response.data.Stats.successful} of ${response.data.Stats.total} bookmarks migrated`,
                                                type: "success",
                                                isLoading: false,
                                                autoClose: 5000
                                            });
                                        } else {
                                            toast.update(loadingToast, {
                                                render: "Migration failed",
                                                type: "error",
                                                isLoading: false,
                                                autoClose: 5000
                                            });
                                        }
                                    } catch (error) {
                                        toast.error("Migration failed: " + (error as Error).message);
                                    }
                                }}
                            >
                                Migrate Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Preferences;