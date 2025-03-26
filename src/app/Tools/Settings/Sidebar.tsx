import React from "react";
import { IToolsModalData, IToolsSettingsTabs } from "./Types";
import {
    Edit,
    Cloud,
    CloudOutlined,
    Book,
    LocalMall,
    SettingsOutlined,
    LocalMallOutlined,
    BookOutlined,
    VerifiedUser,
    VerifiedUserOutlined,
    Settings,
    AutoFixHigh,
    AutoFixHighOutlined,
    AdminPanelSettings,
    AdminPanelSettingsOutlined,
    EditOutlined
} from '@mui/icons-material';
import {
    useWindowCheck
} from "@Hooks"

interface SidebarProps {
    ModalState: IToolsModalData
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>
}

const LongSidebarsOn = [
    IToolsSettingsTabs.Preferences,
    IToolsSettingsTabs.Contribute,
    IToolsSettingsTabs.BeAdmin,
    IToolsSettingsTabs.Cloud,
]

function Sidebar({ ModalState, SetModalState }: SidebarProps) {
    const isClient = useWindowCheck();

    function CheckAdminOptionVisibility() {
        if (isClient) {
            const AdminSignature = localStorage.getItem("AdminOptions");
            if (AdminSignature) {
                SetModalState({
                    ...ModalState,
                    isAdminOptionVisible: true
                })
            }
        }
    }

    function SwitchTab(type: IToolsSettingsTabs) {
        SetModalState({
            ...ModalState,
            type: type
        })
    }

    React.useEffect(() => {
        CheckAdminOptionVisibility();
    }, [isClient]);

    return (
        <div className={`flex flex-col gap-6 pl-2 pr-4 py-4 top-0 mt-12 ${LongSidebarsOn.includes(ModalState.type) ? "mb-[-2rem]" : "mb-10"}`} style={{ borderRight: `1px solid var(--bookmark-border)` }}>

            <div
                key={IToolsSettingsTabs.Create}
                className="flex flex-row gap-2 leading-6 cursor-pointer"
                onClick={() => SwitchTab(IToolsSettingsTabs.Create)}
                style={{
                    color: ModalState.type === IToolsSettingsTabs.Create ? "var(--font-color)" : "var(--description-font-color)"
                }}
            >
                {
                    ModalState.type === IToolsSettingsTabs.Create ? <Book /> : <BookOutlined sx={{ color: "var(--description-font-color)" }} />
                }
                Create
            </div>

            {
                ModalState.type === IToolsSettingsTabs.Edit && (
                    <div
                        key={IToolsSettingsTabs.Edit}
                        className="flex flex-row gap-2 leading-6 cursor-pointer"
                        onClick={() => SwitchTab(IToolsSettingsTabs.Edit)}
                        style={{
                            color: ModalState.type === IToolsSettingsTabs.Edit ? "var(--font-color)" : "var(--description-font-color)"
                        }}
                    >
                        {
                            ModalState.type === IToolsSettingsTabs.Edit ? <Edit /> : <EditOutlined sx={{ color: "var(--description-font-color)" }} />
                        }
                        Edit
                    </div>
                )
            }

            {
                ModalState.type === IToolsSettingsTabs.AdminEdit && (
                    <div
                        key={IToolsSettingsTabs.Edit}
                        className="flex flex-row gap-2 leading-6 cursor-pointer"
                        onClick={() => SwitchTab(IToolsSettingsTabs.Edit)}
                        style={{
                            color: ModalState.type === IToolsSettingsTabs.AdminEdit ? "var(--font-color)" : "var(--description-font-color)"
                        }}
                    >
                        {
                            ModalState.type === IToolsSettingsTabs.AdminEdit ? <AdminPanelSettings /> : <AdminPanelSettingsOutlined sx={{ color: "var(--description-font-color)" }} />
                        }
                        Edit
                    </div>
                )
            }

            <div
                key={IToolsSettingsTabs.Marketplace}
                className="flex flex-row gap-2 leading-6 cursor-pointer"
                onClick={() => SwitchTab(IToolsSettingsTabs.Marketplace)}
                style={{
                    color: ModalState.type === IToolsSettingsTabs.Marketplace ? "var(--font-color)" : "var(--description-font-color)"
                }}
            >
                {
                    ModalState.type === IToolsSettingsTabs.Marketplace ? <LocalMall /> : <LocalMallOutlined sx={{ color: "var(--description-font-color)" }} />
                }
                Marketplace
            </div>

            <div
                key={IToolsSettingsTabs.Preferences}
                className="flex flex-row gap-2 leading-6 cursor-pointer"
                onClick={() => SwitchTab(IToolsSettingsTabs.Preferences)}
                style={{
                    color: ModalState.type === IToolsSettingsTabs.Preferences ? "var(--font-color)" : "var(--description-font-color)"
                }}
            >
                {
                    ModalState.type === IToolsSettingsTabs.Preferences ? <Settings /> : <SettingsOutlined sx={{ color: "var(--description-font-color)" }} />
                }
                Preferences
            </div>

            <div
                key={IToolsSettingsTabs.Contribute}
                className="flex flex-row gap-2 leading-6 cursor-pointer"
                onClick={() => SwitchTab(IToolsSettingsTabs.Contribute)}
                style={{
                    color: ModalState.type === IToolsSettingsTabs.Contribute ? "var(--font-color)" : "var(--description-font-color)"
                }}
            >
                {
                    ModalState.type === IToolsSettingsTabs.Contribute ? <AutoFixHigh /> : <AutoFixHighOutlined sx={{ color: "var(--description-font-color)" }} />
                }
                Contribute
            </div>

            {
                ModalState.isAdminOptionVisible && !ModalState.isAdmin && (
                    <div
                        key={IToolsSettingsTabs.BeAdmin}
                        className="flex flex-row gap-2 leading-6 cursor-pointer"
                        onClick={() => SwitchTab(IToolsSettingsTabs.BeAdmin)}
                        style={{
                            color: ModalState.type === IToolsSettingsTabs.BeAdmin ? "var(--font-color)" : "var(--description-font-color)"
                        }}
                    >
                        {
                            ModalState.type === IToolsSettingsTabs.BeAdmin ? <VerifiedUser /> : <VerifiedUserOutlined sx={{ color: "var(--description-font-color)" }} />
                        }
                        Administration
                    </div>
                )
            }

            {
                ModalState.isAdmin && (
                    <div
                        key={IToolsSettingsTabs.Cloud}
                        className="flex flex-row gap-2 leading-6 cursor-pointer"
                        onClick={() => SwitchTab(IToolsSettingsTabs.Cloud)}
                        style={{
                            color: ModalState.type === IToolsSettingsTabs.Cloud ? "var(--font-color)" : "var(--description-font-color)"
                        }}
                    >
                        {
                            ModalState.type === IToolsSettingsTabs.Cloud ? <Cloud /> : <CloudOutlined sx={{ color: "var(--description-font-color)" }} />
                        }
                        Cloud
                    </div>
                )
            }

        </div>
    );
};

export default Sidebar;