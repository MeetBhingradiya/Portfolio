"use client";

import React from 'react';
import { CopyAll } from '@mui/icons-material';
import { Button } from '@mui/material';
import { Tooltip, Input, Select, SelectItem } from '@heroui/react';
import "@Styles/Tools-CRX.sass"

const URL = "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=@PRODVERSION&x=id%3D@EXTENSIONID%26uc"

function CRXDownload() {
    const [State, SetState] = React.useState<{
        ID: string,
        Version: string,
        Versions: Array<{
            name: string,
            version: string,
        }>
        isFirstRender: boolean
    }>({
        ID: "bppamachkoflopbagkdoflbgfjflfnfl",
        Version: "131",
        Versions: [],
        isFirstRender: true
    })

    function FetchVersions() {
        if (State.isFirstRender) {
            fetch("https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions").then((res) => res.json()).then((data) => {
                SetState({ ...State, Versions: data.versions, isFirstRender: false })
            })
        }
    }

    function DownloadCRX() {
        const url = URL.replace("@PRODVERSION", State.Version).replace("@EXTENSIONID", State.ID)
        window.open(url)
    }

    React.useEffect(() => {
        FetchVersions()
    }, [])

    return (
        <div className='Page CENTER flex flex-col gap-6 p-4'>
            <div className='text-4xl font-bold'>Chrome Extenstion CRX Download</div>

            <div className='text-xl dark:text-slate-300 bg-gray-800 text-white rounded-md p-5 shadow-lg select-all flex flex-row gap-2 items-center justify-between'>
                <Input
                    placeholder='Extension ID'
                    value={State.ID}
                    onChange={(e) => SetState({ ...State, ID: e.target.value })}
                />
            </div>
            <div className='text-xl dark:text-slate-300 bg-gray-800 text-white rounded-md p-5 shadow-lg select-all flex flex-row gap-2 items-center justify-between'>
                <Select
                    selectedKeys={State.Version}
                    onChange={(e) => SetState({ ...State, Version: e.target.value })}
                >
                    {State.Versions.map((Item) => (
                        <SelectItem key={Item.version} value={Item.version}>
                            Chrome {Item.version}
                        </SelectItem>
                    ))}
                </Select>
            </div>

            <div className='mt-5 flex flex-row gap-3'>
                <Button
                    // variant='shadow'
                    onClick={DownloadCRX}
                    sx={{
                        background: "var(--accent-color)",
                        color: "var(--font-color-dark)"
                    }}
                >
                    Download
                </Button>

            </div>
        </div>
    );
}

export default CRXDownload;
