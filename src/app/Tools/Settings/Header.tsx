import React from "react";
import { ModalHeader, Tooltip } from "@heroui/react"
import { IToolsSettingsTabs, ToolsSettingsTabsMenu } from "./Types";

interface HeaderProps {
    type: IToolsSettingsTabs;
    isMaximized: boolean;
    onClose: () => void;
    setIsMaximized: (isMaximized: boolean) => void;
}

function Header({ type, isMaximized, onClose, setIsMaximized }: HeaderProps) {
    return (
        <ModalHeader
            className="flex flex-row justify-between py-4 backdrop-blur-md"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 11,
                borderRadius: "0.5rem 0.5rem 0 0",
            }}
        >
            <div className="flex flex-row gap-2 leading-6">
                {
                    Object.entries(ToolsSettingsTabsMenu).map(([key, value]) => (
                        type === key && (
                            <div key={key} className="flex flex-row gap-2 leading-6">
                                type === key ? value.Active
                                {value.Title}
                            </div>
                        )
                    ))
                }
            </div>

            <div className="flex flex-row gap-1 items-center">
                <Tooltip content="Close" placement="top">
                    <div className="h-3 w-3 bg-red-500 rounded-full cursor-pointer" onClick={onClose}></div>
                </Tooltip>
                <Tooltip content={
                    isMaximized ? "Minimize" : "Maximize"
                } placement="top">
                    <div className="h-3 w-3 bg-yellow-500 rounded-full cursor-pointer"></div>
                </Tooltip>
                {/* <Tooltip content="Minimize" placement="top"> */}
                <div className="h-3 w-3 bg-green-500 rounded-full cursor-pointer"></div>
                {/* </Tooltip> */}
            </div>
        </ModalHeader>
    );
};

export default Header;