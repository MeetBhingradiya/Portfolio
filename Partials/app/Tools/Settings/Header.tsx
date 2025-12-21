import React from "react";
import { ModalHeader, Tooltip } from "@heroui/react";
import { IToolsSettingsTabs } from "./Types";
import {
    Edit,
    Book,
    LocalMall,
    VerifiedUser,
    Settings,
    CloudQueue,
    Cloud,
    Security,
    AutoFixHigh
} from "@mui/icons-material";

interface HeaderProps {
    type: IToolsSettingsTabs;
    isAdmin?: boolean;
    DisableAdmin?: () => any;
    isMaximized: boolean;
    onClose: () => void;
    setIsMaximized: (isMaximized: boolean) => void;
}

function Header({
    type,
    isMaximized,
    onClose,
    setIsMaximized,
    isAdmin,
    DisableAdmin
}: HeaderProps) {
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
                borderBottom: "1px solid var(--bookmark-border)"
            }}>
            <div className="flex flex-row gap-2 leading-6">
                {type === IToolsSettingsTabs.Create && (
                    <div
                        key={IToolsSettingsTabs.Create}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Book />
                        Create
                    </div>
                )}

                {type === IToolsSettingsTabs.AdminCreate && (
                    <div
                        key={IToolsSettingsTabs.AdminCreate}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Book /> <CloudQueue />
                        Cloud Create
                    </div>
                )}

                {type === IToolsSettingsTabs.Edit && (
                    <div
                        key={IToolsSettingsTabs.Edit}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Edit />
                        Edit
                    </div>
                )}

                {type === IToolsSettingsTabs.AdminEdit && (
                    <div
                        key={IToolsSettingsTabs.AdminEdit}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Edit /> <CloudQueue />
                        Cloud Edit
                    </div>
                )}

                {type === IToolsSettingsTabs.Marketplace && (
                    <div
                        key={IToolsSettingsTabs.Marketplace}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <LocalMall />
                        Marketplace
                    </div>
                )}

                {type === IToolsSettingsTabs.Preferences && (
                    <div
                        key={IToolsSettingsTabs.Preferences}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Settings />
                        Preferences
                    </div>
                )}

                {type === IToolsSettingsTabs.Contribute && (
                    <div
                        key={IToolsSettingsTabs.Contribute}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <AutoFixHigh />
                        Contribute
                    </div>
                )}

                {type === IToolsSettingsTabs.BeAdmin && (
                    <div
                        key={IToolsSettingsTabs.BeAdmin}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <VerifiedUser />
                        Be Admin
                    </div>
                )}

                {type === IToolsSettingsTabs.Cloud && (
                    <div
                        key={IToolsSettingsTabs.Cloud}
                        className="flex flex-row gap-2 leading-6 select-none">
                        <Cloud />
                        Cloud
                    </div>
                )}
            </div>

            {isAdmin && (
                <Tooltip
                    content="You are using Administrator Mode, Click to Disable"
                    placement="top">
                    <div
                        className="flex flex-row gap-2 leading-6 select-none text-xs"
                        onClick={DisableAdmin}>
                        <Security />
                    </div>
                </Tooltip>
            )}

            <div className="flex flex-row gap-1 items-center">
                <Tooltip
                    content="Close"
                    placement="top">
                    <div
                        className="h-3 w-3 bg-red-500 rounded-full cursor-pointer"
                        onClick={onClose}></div>
                </Tooltip>
                <Tooltip
                    content={isMaximized ? "Minimize" : "Maximize"}
                    placement="top">
                    <div
                        className="h-3 w-3 bg-yellow-500 rounded-full cursor-pointer"
                        onClick={() => setIsMaximized(!isMaximized)}></div>
                </Tooltip>
                {/* <Tooltip content="Minimize" placement="top"> */}
                <div className="h-3 w-3 bg-green-500 rounded-full cursor-pointer"></div>
                {/* </Tooltip> */}
            </div>
        </ModalHeader>
    );
}

export default Header;
