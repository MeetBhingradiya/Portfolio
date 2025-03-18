import React from "react";
import {
    IToolsSettingsTabs,
    ToolsSettingsTabsMenu
} from "./Types";

import type {
    IBookmark,
    IToolsState,
    IToolsModalData
} from "./Types";

interface BodyProps {
    ModalState: IToolsModalData
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>

    State: IToolsState
    SetState: React.Dispatch<React.SetStateAction<IToolsState>>
}

function Body({
    ModalState,
    SetModalState,
    State,
    SetState
}: BodyProps) {
    return (
        <div className={ToolsSettingsTabsMenu[ModalState.type].Class}>

        </div>
    );
};

export default Body;