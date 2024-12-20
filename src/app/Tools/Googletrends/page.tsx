"use client"

import React from "react";
import { Countrys } from "@Types/Region";
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
} from "@nextui-org/react";
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

interface IState {
    Regions: Array<{
        key: string
        value: string
    }>
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
                    `https://trends.google.com/trends/api/dailytrends?geo=${Region.value ?? 'IN'}&ed=${_date}`
                );
            }
        }

        try {
            let results = await Promise.all(
                urls.map((url) =>
                    fetch(url).then((r) => {
                        if (!r.ok) {
                            setState({
                                ...State,
                                isERROR: true,
                            });
                            throw new Error(`Failed to fetch: ${url}`);
                        }
                        return r.text();
                    })
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
            getQuerys();
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
            <h1>Google Tredens Querys</h1>
            {/* Form Hook */}
            {
                State.isERROR && (
                    <div className="flex items-center justify-center">
                        <Alert
                            hideIconWrapper
                            color="error"
                            description="Add CORS Extension to your Browser to Fix this Issue"
                            title="Server ERROR"
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

                {/* <MUISelect
                    className="max-w-xs"
                    multiple
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {
                                State.Regions.map(({ key, value }, index: number) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <Image className="flex-shrink-0" height={30} width={40} src={`/flags/${value}.png`} alt={key} />
                                        {
                                            State.Settings.ShowChips && (
                                                <Chip
                                                    label={key}
                                                // onDelete={() => {
                                                //     let Regions = State.Regions;
                                                //     Regions.splice(index, 1);
                                                //     setState({
                                                //         ...State,
                                                //         Regions
                                                //     });
                                                // }}
                                                />
                                            )
                                        }
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
                </MUISelect> */}

                <Select
                    aria-label="Select"
                    className="min-w-36 w-[30vw] p-5"
                    value={State.Regions.map(r => r.value)}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {
                                State.Regions.map(({ key, value }) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <img className="flex-shrink-0 h-[20px] w-[30px]" src={`/flags/${value}.png`} alt={key} />
                                        {
                                            State.Settings.ShowChips && (
                                                <Chip
                                                    label={key}
                                                />
                                            )
                                        }
                                    </div>
                                ))
                            }
                        </Box>
                    )}
                >
                    {
                        Object.entries(Countrys).map(([code, name]) => (
                            <SelectItem
                                textValue={name.toString()}
                                key={name}
                                value={code}
                                onPress={() => {
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
                                style={{
                                    // ? Highlight Selected
                                    backgroundColor: State.Regions.findIndex(r => r.value === code) !== -1 ? "rgba(0, 0, 0, 0.1)" : "transparent"
                                }}
                            >
                                <div className="flex gap-2 items-center">
                                    <img className="flex-shrink-0 h-[70px] w-[100px]" src={`/flags/${code}.png`} alt={name} />
                                    <div className="flex flex-col">
                                        <span className="text-small">{name}</span>
                                        <span className="text-tiny text-default-400">{code}</span>
                                    </div>
                                </div>
                            </SelectItem>
                        ))
                    }
                </Select>

                <Button
                    onPress={async () => {
                        // TODO: Add Model For Settings
                    }}
                    variant="light"
                    color="secondary"
                    isIconOnly
                >
                    <Settings />
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