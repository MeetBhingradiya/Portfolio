import React from "react";
import { IToolsSettingsTabs, ToolsSettingsTabsMenu } from "./Types";

interface SidebarProps {
    type: IToolsSettingsTabs
    SwitchTab: (type: IToolsSettingsTabs) => void
}

function Sidebar({ type, SwitchTab }: SidebarProps) {
    return (
        <div className="flex flex-col gap-3 p-2 top-0 mt-12" style={{ width: "28%" }}>
            <div className="flex flex-row gap-2 leading-6">
                {
                    Object.entries(ToolsSettingsTabsMenu).map(([key, value]) => (
                        type === key && (
                            <div key={key} className="flex flex-row gap-2 leading-6" onClick={() => {
                                SwitchTab(key)
                            }}>
                                {
                                    type === key ? value.Active : value.Inactive
                                }
                                {value.Tab}
                            </div>
                        )
                    ))
                }
            </div>
        </div>
    );
};

export default Sidebar;