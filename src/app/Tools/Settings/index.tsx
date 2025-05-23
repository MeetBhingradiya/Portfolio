import React from "react";
import {
    IToolsSettingsTabs,
} from "./Types";

import type {
    IBookmark,
    IToolsState,
    IToolsModalData
} from "./Types";
import { cn, ModalBody } from "@heroui/react";
import Sidebar from "./Sidebar";
import BeAdmin from "./BeAdmin";
import BookmarkEditor from "./BookmarkEditor";
import Preferences from "./Preferences";
import Marketplace from "./Marketplace";
import Cloud from "./Cloud";
import { DefualtBookmark } from "./Types";
import Contribute from "./Contribute";

interface BodyProps {
    ModalState: IToolsModalData
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>
    State: IToolsState
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>
}

function ModelsBody({
    ModalState,
    SetModalState,
    State,
    Dispatch
}: BodyProps) {

    const SwitchTab = (type: IToolsSettingsTabs) => {
        SetModalState((ModalData) => {
            return {
                ...ModalData,
                type: type,
            }
        });
    }

    const SetBookmark = (bookmark: IBookmark) => {
        SetModalState((ModalData) => {
            return {
                ...ModalData,
                bookmark: bookmark,
            }
        });
    }

    React.useEffect(() => {

        if (ModalState.type === IToolsSettingsTabs.Create) {
            SetModalState((ModalData) => {
                return {
                    ...ModalData,
                    bookmark: DefualtBookmark,
                }
            });
        }
        
        if (ModalState.type === IToolsSettingsTabs.Edit) {
            SetModalState((ModalData) => {
                return {
                    ...ModalData,
                    bookmark: DefualtBookmark,
                }
            });
        }

    }, [ModalState.type]);

    return (
        <ModalBody
            className="flex flex-row gap-2 px-2"
            style={{
                overflow: "hidden"
            }}
        >

            {/* Sidebar Menu */}
            <Sidebar
                ModalState={ModalState}
                SetModalState={SetModalState}
            />

            {/* Main Content */}
            <div
                className={"flex flex-col gap-4 px-2 pt-16 pb-16 z-0 HideScrollbars"}
                
                style={{
                    width: "100%",
                    overflow: "auto",
                    height: "100%",
                    zIndex: 0,
                }}
            >
                {/* Rendering Tab Content */}
                {
                    ModalState.type === IToolsSettingsTabs.Create && (
                        <BookmarkEditor
                            bookmark={DefualtBookmark}
                            isAdmin={ModalState.isAdmin}
                            isCreateMode={true}
                            setBookmark={SetBookmark}
                        />
                    )
                }

                {
                    ModalState.type === IToolsSettingsTabs.Edit && (
                        <BookmarkEditor
                            bookmark={ModalState.bookmark}
                            isAdmin={ModalState.isAdmin}
                            isCreateMode={false}
                            setBookmark={SetBookmark}
                        />
                    )
                }
                
                {
                    ModalState.type === IToolsSettingsTabs.Preferences && (
                        <Preferences
                            State={State}
                            Dispatch={Dispatch}
                            ModalState={ModalState}
                        />
                    )
                }

                {
                    ModalState.type === IToolsSettingsTabs.Contribute && (
                        <Contribute/>
                    )
                }
                
                {
                    ModalState.type === IToolsSettingsTabs.BeAdmin && (
                        <BeAdmin
                            SetModalState={SetModalState}
                        />
                    )
                }
                
                {
                    ModalState.type === IToolsSettingsTabs.Marketplace && (
                        <Marketplace
                            ModalState={ModalState}
                            SetModalState={SetModalState}
                            State={State}
                            Dispatch={Dispatch}
                        />
                    )
                }

                {
                    ModalState.type === IToolsSettingsTabs.Cloud && (
                        <Cloud
                            ModalState={ModalState}
                            SetModalState={SetModalState}
                            State={State}
                            Dispatch={Dispatch}
                        />
                    )
                }
                </div>

        </ModalBody>
    );
};

export default ModelsBody;