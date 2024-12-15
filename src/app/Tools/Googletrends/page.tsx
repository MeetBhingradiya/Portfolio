"use client"

import React, { useEffect } from "react";
import { Countrys } from "@Types/Region";
import "@Styles/Tools-GoogleTrends.sass";
import {
    Button,
    // Select,
    // SelectItem,
} from "@nextui-org/react";
import {
} from "@mui/icons-material";
import {
    Select,
    MenuItem,
    Box,
    Chip,
    TextField
} from "@mui/material";
import Footer from "@Components/Footer";
import Image from "next/image";
import { fetchTrendingQueries } from "./fetchQuerys";

interface IState {
    Regions: Array<{
        key: string
        value: string
    }>
    PreviousDays: number
    Queries: Array<string>
    Loading: boolean
    Settings: {
        ShowChips: boolean
        SingleDisplayMode: boolean
        ListStyle: "List" | "Grid"
        isFirstRender: boolean
    }
}

function GoogleTredensQuerys() {
    const [State, setState] = React.useState<IState>({
        Regions: [
            {
                key: "India",
                value: "IN"
            }
        ],
        PreviousDays: 1,
        Queries: [],
        Loading: false,
        Settings: {
            ShowChips: true,
            SingleDisplayMode: true,
            ListStyle: "Grid",
            isFirstRender: true
        }
    });

    async function getQuerys() {
        setState({
            ...State,
            Loading: true
        });
        // ? Runs Multiple Requests at a time on Every Region Selected and Previous Days
        let Queries: Array<string> = [];
        let Regions = State.Regions;
        let PreviousDays = State.PreviousDays;

        // ? Fetching Queries
        let Results = await Promise.all(
            new Array(Regions.length).fill(0).map(async (_, index) => {
                let Region = Regions[index];
                return await fetchTrendingQueries(PreviousDays, Region.value);
            })
        );

        // ? Parsing Queries
        Results.forEach((result) => {
            Queries.push(...result);
        });

        setState({
            ...State,
            Queries,
            Loading: false
        });
    }

    useEffect(() => {
        if (State.Settings.isFirstRender) {
            setState({
                ...State,
                Settings: {
                    ...State.Settings,
                    isFirstRender: false
                }
            });
            getQuerys();
        }
    }, []);

    return (
        <div className={"GoogleTrends"}>
            <h1>Google Tredens Querys</h1>
            {/* Form Hook */}

            {/* Input for Previous Days */}
            <div className="flex items-center gap-3">
                <input
                    type="range"
                    min={1}
                    max={11}
                    step={2}
                    className="max-w-xs"
                    value={State.PreviousDays}
                    onChange={(e: any) => {
                        setState({
                            ...State,
                            PreviousDays: Number(e.target.value)
                        });
                    }}
                    style={{
                        // ? Range Styling
                        background: `linear-gradient(to right, #000 0%, #000 ${State.PreviousDays * 10}%, #fff ${State.PreviousDays * 10}%, #fff 100%)`

                    }}
                />

                <Select
                    className="max-w-xs"
                    multiple
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {
                                State.Regions.map(({ key, value }, index: number) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <Image className="flex-shrink-0" height={30} width={40} src={`/flags/${value}.png`} alt={key} />
                                        {/* <Chip label={key} /> */}
                                    </div>
                                ))
                            }
                        </Box>
                    )}
                    value={State.Regions}
                >
                    {
                        Object.entries(Countrys).map(([code, name]) => (
                            <MenuItem
                                key={code}
                                value={code}
                                onClick={() => {
                                    let Regions = State.Regions;
                                    let index = Regions.findIndex(r => r.value === code);
                                    // ? Set Limit to 5
                                    if (Regions.length >= 5 && index === -1) {
                                        return;
                                    }
                                    if (index === -1) {
                                        Regions.push({
                                            key: name,
                                            value: code
                                        });
                                    } else {
                                        Regions.splice(index, 1);
                                    }
                                    setState({
                                        ...State,
                                        Regions
                                    });
                                }}
                                sx={{
                                    // ? Highlight Selected
                                    backgroundColor: State.Regions.findIndex(r => r.value === code) !== -1 ? "rgba(0, 0, 0, 0.1)" : "transparent"
                                }}
                            >
                                <div className="flex gap-2 items-center">
                                    <Image className="flex-shrink-0" height={90} width={120} src={`/flags/${code}.png`} alt={name} />
                                    <div className="flex flex-col">
                                        <span className="text-small">{name}</span>
                                        <span className="text-tiny text-default-400">{code}</span>
                                    </div>
                                </div>
                            </MenuItem>
                        ))
                    }
                </Select>

                <Button
                    onPress={async () => {
                        getQuerys();
                    }}
                    variant="shadow"
                    color="secondary"
                >
                    Fetch
                </Button>
            </div>
            {/* List of Querys with Copy Button */}
            <div className={
                State.Settings.ListStyle === "List" ? "QueryList-List" : "QueryList-Grid"
            }>
                {
                    State.Queries.map((query, index) => (
                        <Chip
                            className="QueryList-Item"
                            key={index}
                            label={query}
                            onClick={() => {
                                navigator.clipboard.writeText(query);
                            }}
                        />
                    ))
                }
            </div>
            <Footer />
        </div>
    )
}

export default GoogleTredensQuerys;