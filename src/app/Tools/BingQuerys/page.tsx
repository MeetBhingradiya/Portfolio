/**
 *  @FileID          app\Tools\BingQuerys\page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC) IST (Kolkata +5:30 UTC)
 *  @modified 18/01/25 2:26 PM IST (Kolkata +5:30 UTC)
 */

"use client"

import React from "react";
import { Countrys } from "@Types/Region";

type CountryMap = {
    [key: string]: string;
};
const countryMap: CountryMap = Countrys;

import "@Styles/Tools-GoogleTrends.sass";
import {
    Alert,
    Button,
    Checkbox,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    SelectedItems,
    Tooltip,
} from "@nextui-org/react";
import type { Selection } from "@nextui-org/react";
import { Settings } from "@mui/icons-material";
import {
    Select as MUISelect,
    MenuItem,
    Box,
    Chip,
    TextField
} from "@mui/material";
import Footer from "@Components/Footer";
import Image from "next/image";
import { removeDuplicates } from "@Utils/RemoveDuplicates";
import { Axios } from "@Utils/Axios";

type Region = {
    label: string
    value: string
};

interface IState {
    Regions: Selection
    PreviousDays: number
    Queries: Array<string>
    Loading: boolean
    isERROR: boolean
    Settings: {
        ShowChips: boolean
        ListStyle: "List" | "Grid"
        isFirstRender: boolean
        SelectMenuBy: "MUI" | "NextUI"
    }
    Model: {
        isOpen: boolean
    }
}

function BingQuerys() {
    const [State, setState] = React.useState<IState>({
        Regions: new Set(["IN"]),
        PreviousDays: 1,
        Queries: [],
        Loading: false,
        isERROR: false,
        Settings: {
            ShowChips: false,
            ListStyle: "List",
            isFirstRender: true,
            SelectMenuBy: "NextUI"
        },
        Model: {
            isOpen: false
        }
    });

    async function getQuerys(currentTimestamp: number = Date.now()) {
        setState({
            ...State,
            Loading: true,
        });

        let Region;
        let Days = State.PreviousDays;
        let urls: string[] = [];

        for (Region of State.Regions) {
            for (let i = 0; i < Days; i++) {
                let _date: any = new Date(currentTimestamp - i * (24 * 60 * 60 * 1000));
                _date = _date.toISOString();
                _date = _date.substring(0, _date.indexOf('T')).replace(/-/g, '');
                urls.push(
                    `https://trends.google.com/trends/api/dailytrends?geo=${Region ?? 'IN'}&ed=${_date}`
                );
            }
        }

        try {
            let results = await Promise.all(
                urls.map((url) =>
                    // fetch(url).then((r) => {
                    //     if (!r.ok) {
                    //         setState({
                    //             ...State,
                    //             isERROR: true,
                    //         });
                    //         throw new Error(`Failed to fetch: ${url}`);
                    //     }
                    //     return r.text();
                    // })
                    Axios.post("/api/cors", {
                        body: {
                            endpoint: url,
                            method: "GET",
                            body: null,
                            headers: {}
                        }
                    }).then((r) => r.data.data)
                )
            );

            function handleResult(result: any) {
                const json = JSON.parse(result.substring(6));
                return json.default.trendingSearchesDays
                    .map((day: any) => {
                        return day.trendingSearches.map((search: any) => search.title.query.toLowerCase());
                    })
                    .flat()
                    .filter((q: any) => q);
            }

            let queries = results.map(handleResult).flat();
            queries = removeDuplicates(queries);

            // Update state with parsed queries
            setState({
                ...State,
                Queries: queries,
                Loading: false,
            });
        } catch (error) {
            console.error('Error fetching Google Trends queries:', error);
            setState({
                ...State,
                Loading: false,
                isERROR: true,
            });
        }
    }

    React.useEffect(() => {
        if (State.Settings.isFirstRender) {
            setState({
                ...State,
                Settings: {
                    ...State.Settings,
                    isFirstRender: false
                }
            });
            // getQuerys();
        }
    }, []);

    React.useEffect(() => {
        (async () => {
            await setState({
                ...State,
                isERROR: false
            })

            getQuerys()
        })()
    }, [
        State.Regions,
        State.PreviousDays
    ]);

    return (
        <div className={"GoogleTrends"}>
            <h1>Google Trends Querys</h1>
            {/* Form Hook */}
            {
                State.isERROR && (
                    <div className="flex items-center justify-center">
                        <Alert
                            hideIconWrapper
                            color="danger"
                            description="Missing / Disabled CORS Extension on your Browser."
                            title="Browser ERROR"
                            variant="bordered"
                        />
                    </div>
                )
            }

            {/* Input for Previous Days */}
            <div className="flex items-center gap-3">
                <input
                    type="range"
                    min={1}
                    max={11}
                    step={1}
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
                    aria-label="Select"
                    selectionMode="multiple"
                    className="min-w-36 w-[25vw] p-5"
                    selectedKeys={State.Regions}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        if (e.target.value.split(",").filter(item => item.trim() !== "").length < 1) {
                            return;
                        }
                        setState({
                            ...State,
                            Regions: new Set(e.target.value.split(",").filter(item => item.trim() !== ""))
                        });
                    }}
                    renderValue={(items) => {
                        return (<div className="flex flex-wrap gap-3">
                            {
                                Array.from(State.Regions).map((Code: any) => {
                                    let CountryLable = countryMap[Code]

                                    if (!CountryLable) {
                                        CountryLable = Code
                                    }

                                    return (
                                        <Tooltip content={CountryLable} key={Code}>
                                            <Image
                                                width={30}
                                                height={20}
                                                src={`/flags/${Code.toLowerCase()}.png`}
                                                alt={Code}
                                            />
                                        </Tooltip>
                                    )
                                })
                            }
                        </div>)
                    }}
                >
                    {
                        Object.entries(Countrys).map(([key, name]) => (
                            <SelectItem
                                textValue={name.toString()}
                                key={key}
                            >
                                <div className="flex gap-4 items-center">
                                    <Image
                                        className="flex-shrink-0 h-[70px] w-[100px] rounded-md"
                                        height={70}
                                        width={100}
                                        src={`/flags/${key.toLowerCase()}.png`}
                                        alt={name}
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-small">{name}</span>
                                        <span className="text-tiny text-default-400">{key}</span>
                                    </div>
                                </div>
                            </SelectItem>
                        ))
                    }
                </Select>

                {/* <Button
                    onPress={async () => {
                        // TODO: Add Model For Settings
                    }}
                    variant="light"
                    color="secondary"
                    isIconOnly
                >
                    <Settings />
                </Button> */}

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

export default BingQuerys;