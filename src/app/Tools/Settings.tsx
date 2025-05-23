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