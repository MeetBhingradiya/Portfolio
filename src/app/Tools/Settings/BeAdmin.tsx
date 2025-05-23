"use client";

import React from "react";
import { Axios } from "@Utils";
import { Input, Button } from "@heroui/react"
import { IToolsModalData, IToolsSettingsTabs } from "./Types";

import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff, Security, LockClock } from "@mui/icons-material";
interface BeAdminProps {
    SetModalState: React.Dispatch<React.SetStateAction<IToolsModalData>>
}

function BeAdmin({ SetModalState }: BeAdminProps) {
    const [State, SetState] = React.useState({
        isFetching: false,
        isError: false,
        Message: "",
        TryCount: 0, // ? Max 3 Times then Block the User Using LocalStorage
        isVisible: false,
        isBlocked: false,
        blockExpiry: 0,
        remainingTime: "",
    })

    const [AdminSignature, SetAdminSignature] = React.useState("");

    function HandleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        SetAdminSignature(e.target.value);
    }

    async function FetchAdminSignature() {
        if (State.isBlocked) {
            return;
        }

        if (State.TryCount >= 3) {
            blockUser();
            return;
        }

        try {
            const response = await Axios.post("/api/adminsignature", {
                signature: AdminSignature
            })
            SetState((State) => {
                return {
                    ...State,
                    AdminSignatureToken: response.data.Data,
                    isError: false,
                    Message: "Verified Successfully",
                }
            })
            SetModalState((ModalState) => {
                return {
                    ...ModalState,
                    isAdmin: true,
                    AdminSignature: response.data.Data,
                    type: IToolsSettingsTabs.Cloud
                }
            })
        } catch (error: any) {
            SetState((State) => {
                return {
                    ...State,
                    isError: true,
                    Message: error?.response?.data?.Message,
                }
            })
        } finally {
            SetState((State) => {
                return {
                    ...State,
                    isFetching: false,
                    TryCount: State.TryCount + 1
                }
            })
        }
    }

    const blockUser = () => {
        const blockExpiry = Date.now() + (24 * 60 * 60 * 1000);

        localStorage.setItem('adminAccessBlocked', 'true');
        localStorage.setItem('adminAccessBlockExpiry', blockExpiry.toString());
        localStorage.setItem('adminAccessTryCount', State.TryCount.toString());

        SetState((State) => {
            return {
                ...State,
                isBlocked: true,
                blockExpiry: blockExpiry,
                isError: true,
                Message: "You have exceeded the maximum number of attempts. You are blocked for 24 hours."
            }
        });
    }

    const checkIfBlocked = () => {
        const isBlocked = localStorage.getItem('adminAccessBlocked') === 'true';
        const blockedUntil = localStorage.getItem('adminAccessBlockExpiry');

        if (isBlocked || blockedUntil) {
            if (!blockedUntil) {
                // ? Block Again for 24 Hours
                blockUser();
                return true;
            }

            const expiryTime = parseInt(blockedUntil);
            const now = Date.now();

            if (now < expiryTime) {
                SetState((State) => ({
                    ...State,
                    isBlocked: true,
                    blockExpiry: expiryTime,
                    isError: true,
                    Message: "You have been blocked due to too many failed attempts."
                }));
                return true;
            } else {
                unblockUser();
                return false;
            }
        }
        return false;
    }

    const unblockUser = () => {
        localStorage.removeItem('adminAccessBlocked');
        localStorage.removeItem('adminAccessBlockExpiry');
        localStorage.setItem('adminAccessTryCount', '0');

        SetState(state => ({
            ...state,
            isBlocked: false,
            blockExpiry: 0,
            remainingTime: "",
            TryCount: 0,
            isError: false,
            Message: ""
        }));
    }

    const updateRemainingTime = () => {
        const isBlocked = localStorage.getItem('adminAccessBlocked') === 'true';
        const blockedUntil = localStorage.getItem('adminAccessBlockExpiry');

        if (isBlocked && blockedUntil) {
            const expiryTime = parseInt(blockedUntil);
            const now = Date.now();
            const timeLeft = expiryTime - now;

            if (timeLeft <= 0) {
                unblockUser();
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            SetState(state => ({
                ...state,
                isBlocked: true,
                remainingTime: formattedTime,
                blockExpiry: expiryTime
            }));
        }
    }

    React.useEffect(() => {
        checkIfBlocked();
        updateRemainingTime();

        const timer = setInterval(() => {
            updateRemainingTime();
        }, 1000);

        const savedTryCount = localStorage.getItem('adminAccessTryCount');
        if (savedTryCount && !State.isBlocked) {
            SetState(state => ({
                ...state,
                TryCount: parseInt(savedTryCount)
            }));
        }

        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        if (State.TryCount >= 3 && !State.isBlocked) {
            blockUser();
        } else if (State.TryCount < 3) {
            localStorage.setItem('adminAccessTryCount', State.TryCount.toString());
        }
    }, [State.TryCount, State.isBlocked])

    return (
        <div className="flex flex-col items-center justify-center w-full gap-5 p-6">
            <div className="flex flex-col items-center mb-3">
                {State.isBlocked ? (
                    <LockClock sx={{ width: 100, height: 100, color: "#f44336" }} />
                ) : (
                    <Security sx={{ width: 100, height: 100, color: "#784af4" }} />
                )}
                <h2 className="text-xl font-bold mt-2">Administration Access</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {State.isBlocked
                        ? "Your access has been temporarily blocked"
                        : "Enter your signature to access administration features"}
                </p>
            </div>

            {State.isError && (
                <div className="text-red-500 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm p-3 rounded-lg border border-red-200 dark:border-red-800 shadow-sm w-full max-w-md">
                    {State.Message}
                </div>
            )}

            {State.isBlocked && (
                <div className="flex flex-col items-center w-full max-w-md">
                    <div className="bg-red-50/90 dark:bg-red-950/50 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-5 rounded-lg shadow-sm w-full mb-3">
                        <div className="text-center bg-white/30 dark:bg-black/20 p-3 rounded-md backdrop-blur-sm">
                            <span className="font-mono text-2xl font-semibold tracking-wider">{State.remainingTime}</span>
                            <p className="text-sm mt-1 opacity-70">
                                Time remaining
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {!State.isBlocked && (
                <>
                    <div className="w-full max-w-md">
                        <Input
                            name="AdminSignature"
                            value={AdminSignature}
                            onChange={HandleInputChange}
                            isClearable
                            onClear={() => {
                                SetAdminSignature("");
                            }}
                            placeholder="Enter Admin Signature"
                            type={State.isVisible ? "text" : "password"}
                            classNames={{
                                base: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700",
                                inputWrapper: "shadow-sm hover:shadow-md transition-shadow duration-200"
                            }}
                            startContent={
                                <IconButton
                                    onClick={() => {
                                        SetState((State) => {
                                            return { ...State, isVisible: !State.isVisible }
                                        })
                                    }}
                                >
                                    {State.isVisible ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            }
                        />
                    </div>

                    <Button
                        onPress={FetchAdminSignature}
                        disabled={State.isFetching}
                        className="w-full max-w-md bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                        Check Signature
                    </Button>
                </>
            )}
        </div>
    );
};

export default BeAdmin;