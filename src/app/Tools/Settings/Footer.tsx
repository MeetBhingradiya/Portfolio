import React from "react";
import { toast } from "react-toastify";
import { 
    ModalFooter, 
    Tooltip, 
    Button 
} from "@heroui/react"
import {
    IToolsSettingsTabs,
    IToolsModalData,
    IToolsState,
    DefualtBookmark
} from "./Types";
import {
    Add,
    Restore,
    Save
} from "@mui/icons-material";

interface FooterProps {
    ModalState: IToolsModalData
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>

    State: IToolsState
    SetState: React.Dispatch<React.SetStateAction<IToolsState>>
}

const StorageKey = "Tools";

const LongSidebarsOn = [
    IToolsSettingsTabs.Preferences,
    IToolsSettingsTabs.Contribute,
    IToolsSettingsTabs.BeAdmin,
    IToolsSettingsTabs.Cloud,
]

function Footer({ ModalState, SetModalState, State, SetState }: FooterProps) {

    function isValidUrl(url: string) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    return (
        <ModalFooter
            className="backdrop-blur-md py-1"
            style={{
                position: "absolute",
                display: LongSidebarsOn.includes(ModalState.type) ? "none" : undefined,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 11,
                borderRadius: "0 0 0.5rem 0.5rem",
                borderTop: `1px solid var(--bookmark-border)`
            }}
        >
            {
                ModalState.type === IToolsSettingsTabs.Edit && (
                    <Tooltip content={"Save Changes"} placement="top">
                        <Button
                            isIconOnly
                            color="primary"
                            onPress={() => {
                                // Validate form before saving
                                if (!ModalState.bookmark.Name.trim()) {
                                    toast.error("Bookmark name is required");
                                    return;
                                }

                                if (!isValidUrl(ModalState.bookmark.WebLink)) {
                                    toast.error("Please enter a valid URL");
                                    return;
                                }

                                // Existing save logic
                                const index = State.Bookmarks.findIndex((b) => b.BookmarkID === ModalState.bookmark.BookmarkID);
                                if (index === -1) {
                                    return;
                                }

                                SetState({
                                    ...State,
                                    Bookmarks: [
                                        ...State.Bookmarks.slice(0, index),
                                        ModalState.bookmark,
                                        ...State.Bookmarks.slice(index + 1)
                                    ],
                                    FilterBookmarks: [
                                        ...State.FilterBookmarks.slice(0, index),
                                        ModalState.bookmark,
                                        ...State.FilterBookmarks.slice(index + 1)
                                    ],
                                    Query: "",
                                    // QueryDisplay: "",
                                })

                                SetModalState({
                                    ...ModalState,
                                    isOpen: false
                                })
                            }}
                            variant="light"
                        >
                            <Save />
                        </Button>
                    </Tooltip>
                )
            }
            {
                ModalState.type === IToolsSettingsTabs.Create && (
                    <Tooltip content={"Add New Bookmark"} placement="top">
                        <Button
                            isIconOnly
                            color="success"
                            onPress={() => {
                                // Validate form before adding
                                if (!ModalState.bookmark.Name.trim()) {
                                    toast.error("Bookmark name is required");
                                    return;
                                }

                                if (!isValidUrl(ModalState.bookmark.WebLink)) {
                                    toast.error("Please enter a valid URL");
                                    return;
                                }

                                // Ensure keywords is an array
                                const bookmarkToAdd = {
                                    ...ModalState.bookmark,
                                    Keywords: Array.isArray(ModalState.bookmark.Keywords)
                                        ? ModalState.bookmark.Keywords
                                        : []
                                };

                                SetState({
                                    ...State,
                                    Bookmarks: [
                                        ...State.Bookmarks,
                                        bookmarkToAdd
                                    ],
                                    FilterBookmarks: [
                                        ...State.FilterBookmarks,
                                        bookmarkToAdd
                                    ],
                                    Query: "",
                                    // QueryDisplay: "",
                                });

                                SetModalState({
                                    ...ModalState,
                                    bookmark: DefualtBookmark
                                });

                                SetModalState({
                                    ...ModalState,
                                    isOpen: false
                                })
                            }}
                            variant="light"
                        >
                            <Add />
                        </Button>
                    </Tooltip>
                )
            }

            {
                (ModalState.type === IToolsSettingsTabs.Create || ModalState.type === IToolsSettingsTabs.Edit) && (
                    <Tooltip content="Reset" placement="top">
                        <Button isIconOnly color="secondary" variant="light" onPress={() => {
                            SetModalState({
                                ...ModalState,
                                bookmark: DefualtBookmark
                            })
                            return;
                        }}>
                            <Restore />
                        </Button>
                    </Tooltip>
                )
            }

            {
                ModalState.type === IToolsSettingsTabs.Marketplace && (
                    <Tooltip content="Remove All Bookmarks" placement="top">
                        <Button isIconOnly color="secondary" variant="light" onPress={() => {
                            localStorage.removeItem(StorageKey);
                            SetState({
                                ...State,
                                FilterBookmarks: [],
                                Bookmarks: [],
                            })
                        }}>
                            <Restore />
                        </Button>
                    </Tooltip>
                )
            }

        </ModalFooter>
    );
};

export default Footer;