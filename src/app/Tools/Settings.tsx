/**
 *  @FileID          app/Tools/Settings.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier, or the organization.
 *  
 *  -----------------------------------------------------------------------------  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------  
 *  Last Updated on Version: 1.1.0
 *  -----------------------------------------------------------------------------  
 *  @created 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 *  @modified 13/05/25 12:05 PM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import {
    Modal,
    ModalContent,
} from "@heroui/react";
import {
    IToolsSettingsTabs,
} from "./Settings/Types"
import type {
    IToolsModalData,
    IToolsState,
} from "./Settings/Types"
import Header from "./Settings/Header";
import Footer from "./Settings/Footer";
import ModelsBody from "./Settings/index";

function Settings({
    State,
    Dispatch,
    ModalState,
    SetModalState,
}: {
    State: IToolsState,
    Dispatch: React.Dispatch<React.SetStateAction<IToolsState>>,

    ModalState: IToolsModalData,
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>,
}) {

    function setIsMaximized(isMaximized: boolean) {
        SetModalState({
            ...ModalState,
            isMaximized: isMaximized
        })
    }

    const DisableAdmin = () => {
        SetModalState((prev) => {
            return {
                ...prev,
                isAdmin: false,
                AdminSignature: "",
                type: prev.type !== IToolsSettingsTabs.Cloud ? prev.type : IToolsSettingsTabs.BeAdmin
            }
        })
    }

    return (
        <>
            <Modal
                backdrop="opaque"
                isDismissable={
                    ModalState.type === IToolsSettingsTabs.Edit
                        || ModalState.type === IToolsSettingsTabs.Create
                        || ModalState.type === IToolsSettingsTabs.AdminCreate
                        || ModalState.type === IToolsSettingsTabs.AdminEdit
                        ? false : true
                }
                isKeyboardDismissDisabled={
                    ModalState.type === IToolsSettingsTabs.Edit
                        || ModalState.type === IToolsSettingsTabs.Create
                        || ModalState.type === IToolsSettingsTabs.AdminCreate
                        || ModalState.type === IToolsSettingsTabs.AdminEdit
                        ? false : true
                }
                isOpen={ModalState.isOpen}
                onClose={() => {
                    SetModalState({
                        ...ModalState,
                        isOpen: false
                    })
                }}
                hideCloseButton={true}
                size={ModalState.isMaximized ? "full" : "4xl"}
                scrollBehavior="inside"
            >
                <ModalContent
                    className="backdrop-blur-md"
                    style={{
                        height: ModalState.isMaximized ? "80vh" : "70vh",
                        padding: "0",
                        transition: "all 0.5s ease",
                        borderRadius: "10px",
                        background: "var(--bookmark)",
                        border: "1px solid var(--bookmark-border)",
                        boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)"
                    }}
                >
                    <Header
                        type={ModalState.type}
                        isMaximized={ModalState.isMaximized}
                        onClose={() => {
                            SetModalState({ ...ModalState, isOpen: false })
                        }}
                        setIsMaximized={setIsMaximized}
                        isAdmin={ModalState.isAdmin}
                        DisableAdmin={DisableAdmin}
                    />

                    <ModelsBody
                        ModalState={ModalState}
                        SetModalState={SetModalState}
                        State={State}
                        Dispatch={Dispatch}
                    />

                    <Footer
                        State={State}
                        SetState={Dispatch}
                        ModalState={ModalState}
                        SetModalState={SetModalState}
                    />
                </ModalContent>
            </Modal >
        </>
    );
}

export default Settings;