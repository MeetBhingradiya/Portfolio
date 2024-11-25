"use client"
import React, { useEffect, useRef, useState } from "react";
import { styled } from '@mui/material/styles';
import QRCodeStyling, { Options, FileExtension, CornerSquareType, CornerDotType, Gradient } from "qr-code-styling";
import QRBorder, { DecorationType, ExtensionOptions } from "qr-border-plugin";
import { LicensingModel, generateLicenseKey } from "./generateLicenseKey";
import { windowchek } from "@Utils/windowcheck";
import "@Styles/QR.sass";

// @ Components Imports
import {
    Accordion,
    AccordionItem,
    Input,
    Checkbox,
    Button,
    ButtonGroup,
    Tooltip
} from "@nextui-org/react";

import {
    ToggleButton,
    ToggleButtonGroup,
    toggleButtonGroupClasses,
    Slider
} from "@mui/material";

import {
    WifiProtectedSetup,
    CloudDownload
} from "@mui/icons-material";
import Link from "next/link";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    [`& .${toggleButtonGroupClasses.grouped}`]: {
        margin: theme.spacing(0.5),
        border: 0,
        borderRadius: theme.shape.borderRadius,
        [`&.${toggleButtonGroupClasses.disabled}`]: {
            border: 0,
        },
    },
    [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]:
    {
        marginLeft: -1,
        borderLeft: '1px solid transparent',
    },
}));

const PreDefinedGredient: Gradient = {
    type: "linear",
    rotation: 0,
    colorStops: [
        {
            offset: 0,
            color: "#000000"
        },
        {
            offset: 1,
            color: "#ffffff"
        }
    ]
};

const PredefinedColour = "#000000";


export default function QRCustomizationTool() {
    const [qrCode, setQrCode] = useState<QRCodeStyling>();
    const ref = useRef<HTMLDivElement>(null);
    const [State, setState] = useState<{
        QROptions: Options,

        QRToggleOptions: {
            dotsBackground: "color" | "gradient",
            cornersSquare: "color" | "gradient",
            cornersDot: "color" | "gradient",
            background: "color" | "gradient",
        },

        QRPluginOptions: ExtensionOptions,

        // ? Other Settings
        BorderDesign: boolean,

        // ? Download Options
        FileExt?: FileExtension,
        LicenseKey?: string,
    }>({
        QROptions: {
            shape: "square",
            type: "svg",
            width: 600,
            height: 600,
            margin: 100,
            data: "https://meetbhingradiya.vercel.app/Tools/QR",
            image: "https://meetbhingradiya.vercel.app/favicon.ico",
            qrOptions: {
                errorCorrectionLevel: "M"
            },
            dotsOptions: {
                type: "square",
                color: PredefinedColour
            },
            backgroundOptions: {
                round: 1,
                color: "#ffffff"
            },
            cornersSquareOptions: {
                type: "rounded" as CornerSquareType
            },
            cornersDotOptions: {
                type: "rounded" as CornerDotType
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 5,
                imageSize: 1,
                hideBackgroundDots: true,
                saveAsBlob: false,
            },
        },
        QRPluginOptions: {
            round: 0,
            thickness: 60,
            color: "#000000",
            decorations: {
                top:
                {
                    type: "text" as DecorationType,
                    value: "Scan Here",
                    style: "font: 30px sans-serif; fill: #D5B882;"
                },
                bottom: {
                    type: "text" as DecorationType,
                    value: "Try Me",
                    style: "font: 30px sans-serif; fill: #D5B882;"
                },
                left: {
                    type: "text" as DecorationType,
                    value: "scanme",
                    style: "font: 30px sans-serif; fill: #D5B882;"
                },
                right: {
                    type: "text" as DecorationType,
                    value: "scanme",
                    style: "font: 30px sans-serif; fill: #D5B882;"
                },
            },
            borderInner: {
                color: "#000000",
                thickness: 10,
                dasharray: "0"
            },
            borderOuter: {
                color: "#000000",
                thickness: 10,
                dasharray: "0"
            },
            dasharray: "0",
        },
        BorderDesign: false,
        FileExt: "svg",
        LicenseKey: generateLicenseKey(
            "qr-border-plugin",
            LicensingModel.Perpetual,
            "SM Network",
            1,
            windowchek() ? new URL(window.location.href).hostname : "localhost"
        ),
        QRToggleOptions: {
            dotsBackground: "color",
            cornersSquare: "color",
            cornersDot: "color",
            background: "color"
        }
    })

    function RotateLicenseKey() {
        setState({
            ...State,
            LicenseKey: generateLicenseKey(
                "qr-border-plugin",
                LicensingModel.Perpetual,
                "SM Network",
                1,
                windowchek() ? new URL(window.location.href).hostname : "localhost"
            )
        });
    }

    useEffect(() => {
        const qrInstance = new QRCodeStyling(State.QROptions);
        if (State?.BorderDesign) {
            qrInstance.applyExtension(QRBorder(State.QRPluginOptions as any) as any);
        }
        QRBorder.setKey(State.LicenseKey);
        setQrCode(qrInstance);
    }, [
        State.QROptions,
        State.BorderDesign,
        State.QRPluginOptions,
        State.LicenseKey
    ]);

    useEffect(() => {
        if (ref.current && qrCode) {
            QRCodeStyling._clearContainer(ref.current as any);
            qrCode.append(ref.current);
        }
    }, [qrCode]);

    const handleChange = (field: keyof Options, value: any) => setState({
        ...State,
        QROptions: {
            ...State.QROptions,
            [field]: value
        }
    })

    const handleChangePlugin = (field: keyof ExtensionOptions, value: any) => setState({
        ...State,
        QRPluginOptions: {
            ...State.QRPluginOptions,
            [field]: value
        }
    })

    const onDownloadClick = () => qrCode?.download({ extension: State.FileExt });

    return (
        <div className="QR">
            <h1>QR Code Customization Tool</h1>
            <div className="Body">

                <div className="Preview">
                    <div className="Preview-QR" ref={ref} />
                </div>

                <div className="Controls">
                    <Accordion variant="shadow" className="Accordin" selectionMode="multiple">
                        {/* @Templates */}
                        <AccordionItem
                            title="Templates"
                            subtitle="Choose from the Pre-Defined Templates"
                        >
                            <StyledToggleButtonGroup
                                className="item-CenterToggleButtons"
                                value={State.QROptions.data}
                                exclusive
                                sx={{
                                    // ? Modify All the Items Border-Radius
                                    '& .MuiToggleButtonGroup-firstButton': {
                                        borderRadius: "10px 0 0 10px",
                                    },
                                    '& .MuiToggleButtonGroup-lastButton': {
                                        borderRadius: "0 10px 10px 0",
                                    },
                                }}
                                onChange={(e, value) => {
                                    if (value === null) {
                                        return;
                                    }
                                    return handleChange("data", value);
                                }}
                            >
                                <ToggleButton value="upi">
                                    UPI
                                </ToggleButton>
                                <ToggleButton value="wifi">
                                    Wifi
                                </ToggleButton>
                                <ToggleButton value="bluetooth">
                                    Bluetooth
                                </ToggleButton>
                                <ToggleButton value="contact">
                                    Contact
                                </ToggleButton>
                                <ToggleButton value="email">
                                    Email
                                </ToggleButton>
                                <ToggleButton value="phone">
                                    Phone
                                </ToggleButton>
                            </StyledToggleButtonGroup>
                        </AccordionItem>

                        {/* @Data */}
                        <AccordionItem
                            title="Data"
                            subtitle="Change QR Data to Generate QR Code"
                        >
                            <Input
                                className="item"
                                type="text"
                                label={"QR Data"}
                                value={State.QROptions.data}
                                onChange={(e) => handleChange("data", e.target.value)}
                                isClearable
                                onClear={() => handleChange("data", "")}
                            />
                        </AccordionItem>

                        {/* @Shape */}
                        <AccordionItem
                            title="Shape"
                            subtitle="Customize the Shape of QR Code & Its Border"
                        >
                            <StyledToggleButtonGroup
                                className="item-CenterToggleButtons"
                                value={State.QROptions.shape}
                                exclusive
                                onChange={async (e, value) => {
                                    if (value === null) {
                                        return;
                                    }

                                    setState({
                                        ...State,
                                        QROptions: {
                                            ...State.QROptions,
                                            shape: value
                                        },
                                        QRPluginOptions: {
                                            ...State.QRPluginOptions,
                                            round: value === "circle" ? 1 : 0
                                        }
                                    })
                                }}
                                sx={{
                                    // ? Modify All the Items Border-Radius
                                    '& .MuiToggleButtonGroup-firstButton': {
                                        borderRadius: "10px 0 0 10px",
                                    },
                                    '& .MuiToggleButtonGroup-lastButton': {
                                        borderRadius: "0 10px 10px 0",
                                    },
                                }}
                            >
                                <ToggleButton value="square">
                                    {/* Square SVG */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <rect width="24" height="24" />
                                    </svg>
                                </ToggleButton>
                                <ToggleButton value="circle">
                                    {/* Circle SVG */}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                    </svg>
                                </ToggleButton>
                            </StyledToggleButtonGroup>
                        </AccordionItem>

                        {/* @Image */}
                        <AccordionItem
                            title="Image"
                            subtitle="Add Custom Image into QR Code"
                        >
                            <Input
                                className="item"
                                label="Size"
                                type="range"
                                min="1"
                                max="5"
                                value={State.QROptions.imageOptions?.imageSize ? State.QROptions.imageOptions?.imageSize.toString() : "0"}
                                onChange={(e) => handleChange("imageOptions", { ...State.QROptions.imageOptions, imageSize: parseInt(e.target.value) })}
                            />
                            <Input
                                className="item"
                                type="text"
                                label={"Image"}
                                value={State.QROptions.image}
                                onChange={(e) => handleChange("image", e.target.value)}
                                isClearable
                                onClear={() => handleChange("image", "")}
                            />

                            <div className="p-3">
                                <Checkbox
                                    className="item"
                                    checked={State.QROptions.imageOptions?.hideBackgroundDots}
                                    onChange={(e) => handleChange("imageOptions", { ...State.QROptions.imageOptions, hideBackgroundDots: e.target.checked })}
                                >
                                    Hide Background Dots
                                </Checkbox>
                                <Checkbox
                                    className="item"
                                    checked={State.QROptions.imageOptions?.saveAsBlob}
                                    onChange={(e) => handleChange("imageOptions", { ...State.QROptions.imageOptions, saveAsBlob: e.target.checked })}
                                >
                                    Save as Blob
                                </Checkbox>
                            </div>
                        </AccordionItem>

                        {/* @Dots */}
                        <AccordionItem
                            title="Dots"
                            subtitle="Change QR Dots Style & Color OR Gradient"
                        >
                            <StyledToggleButtonGroup
                                className="item-CenterToggleButtons"
                                value={State.QROptions.dotsOptions?.type}
                                exclusive
                                sx={{
                                    // ? Modify All the Items Border-Radius
                                    '& .MuiToggleButtonGroup-firstButton': {
                                        borderRadius: "10px 0 0 10px",
                                    },
                                    '& .MuiToggleButtonGroup-lastButton': {
                                        borderRadius: "0 10px 10px 0",
                                    },
                                }}
                                onChange={(e, value) => {
                                    if (value === null) {
                                        return;
                                    }
                                    return handleChange("dotsOptions", { ...State.QROptions.dotsOptions, type: value });
                                }}
                            >
                                <Tooltip content="Square">
                                    <ToggleButton value="square">
                                        {/* Square SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                            <rect width="24" height="24" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>

                                <Tooltip content="Rounded">
                                    <ToggleButton value="rounded">
                                        {/* Rounded SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                            <rect width="24" height="24" rx="10" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>

                                <Tooltip content="Extra Rounded">
                                    <ToggleButton value="extra-rounded">
                                        {/* Extra Rounded SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                            <rect width="24" height="24" rx="12" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>

                                <Tooltip content="Classy">
                                    <ToggleButton value="classy">
                                        {/* Classy SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                                            <path d="M0.0229537 10.2253C0.0102767 4.70242 4.47714 0.215004 9.99997 0.202327L23.9999 0.170192L24.0321 14.1702C24.0447 19.693 19.5779 24.1804 14.0551 24.1931L0.0550889 24.2252L0.0229537 10.2253Z" fill="black" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>

                                <Tooltip content="Classy Rounded">
                                    <ToggleButton value="classy-rounded">
                                        {/* Classy Rounded SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                                            <path d="M0.0413167 18.2252C0.0184981 8.28413 8.05885 0.206783 18 0.183964L23.9999 0.170192L24.0137 6.17018C24.0365 16.1113 15.9962 24.1886 6.05507 24.2114L0.0550889 24.2252L0.0413167 18.2252Z" fill="black" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>

                                <Tooltip content="Dots">
                                    <ToggleButton value="dots">
                                        {/* Dots SVG */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="7" />
                                        </svg>
                                    </ToggleButton>
                                </Tooltip>
                            </StyledToggleButtonGroup>


                            <div className="item-Download">
                                {/* Toggle Between Gredient & Colour */}
                                <StyledToggleButtonGroup
                                    className="item-noEffect"
                                    value={State.QRToggleOptions?.dotsBackground}
                                    exclusive
                                    sx={{
                                        // ? Modify All the Items Border-Radius
                                        '& .MuiToggleButtonGroup-firstButton': {
                                            borderRadius: "10px 0 0 10px",
                                        },
                                        '& .MuiToggleButtonGroup-lastButton': {
                                            borderRadius: "0 10px 10px 0",
                                        },
                                    }}
                                    onChange={(e, value) => {
                                        if (value === null) {
                                            return;
                                        }
                                        return setState({
                                            ...State,
                                            QRToggleOptions: {
                                                ...State.QRToggleOptions,
                                                dotsBackground: value
                                            },
                                            QROptions: {
                                                ...State.QROptions,
                                                dotsOptions: {
                                                    ...State.QROptions.dotsOptions,
                                                    gradient: value === "gradient" ? PreDefinedGredient : undefined,
                                                    color: value === "color" ? PredefinedColour : undefined
                                                }
                                            }
                                        });
                                    }}
                                >
                                    <ToggleButton value="color">Color</ToggleButton>
                                    <ToggleButton value="gradient">Gradient</ToggleButton>
                                </StyledToggleButtonGroup>
                            </div>
                            {
                                State.QRToggleOptions?.dotsBackground === "color" && (
                                    <label
                                        className="item"
                                        style={{
                                            backgroundColor: State.QROptions.dotsOptions?.color,
                                            width: "50px",
                                            height: "50px",
                                            borderRadius: State.QROptions.dotsOptions?.type === "rounded" ? "10px" : "0px",
                                            border: State.QROptions.dotsOptions?.type === "rounded" ? "1px solid #000000" : "none"
                                        }}>
                                        <input
                                            className="Hide"
                                            type="color"
                                            value={State.QROptions.dotsOptions?.color}
                                            onChange={(e) => handleChange("dotsOptions", { ...State.QROptions.dotsOptions, color: e.target.value })}
                                        />

                                    </label>
                                )
                            }

                            {/* Gredient Generation Options */}
                            {/* 
                                type: "radial" | "linear" // ToggleButton
                                rotation?: number; // Input Range
                                colorStops: { 
                                    offset: number;
                                    color: string;
                                }[];
                            */}

                            {
                                State.QRToggleOptions?.dotsBackground === "gradient" && (<>
                                    <StyledToggleButtonGroup
                                        className="item-CenterToggleButtons"
                                        value={State.QROptions.dotsOptions?.gradient?.type}
                                        exclusive
                                        sx={{
                                            // ? Modify All the Items Border-Radius
                                            '& .MuiToggleButtonGroup-firstButton': {
                                                borderRadius: "10px 0 0 10px",
                                            },
                                            '& .MuiToggleButtonGroup-lastButton': {
                                                borderRadius: "0 10px 10px 0",
                                            },
                                        }}
                                        onChange={(e, value) => {
                                            if (value === null) {
                                                return;
                                            }
                                            return handleChange("dotsOptions", {
                                                ...State.QROptions.dotsOptions,
                                                gradient: {
                                                    ...State.QROptions.dotsOptions?.gradient,
                                                    type: value
                                                }
                                            });
                                        }}
                                    >
                                        <ToggleButton value="radial">Radial</ToggleButton>
                                        <ToggleButton value="linear">Linear</ToggleButton>
                                    </StyledToggleButtonGroup>

                                    <Input
                                        className="item"
                                        type="range"
                                        label={"Rotation"}
                                        min="0"
                                        max="360"
                                        value={State.QROptions.dotsOptions?.gradient?.rotation ? State.QROptions.dotsOptions?.gradient?.rotation.toString() : "0"}
                                        onChange={(e) => handleChange("dotsOptions", {
                                            ...State.QROptions.dotsOptions,
                                            gradient: {
                                                ...State.QROptions.dotsOptions?.gradient,
                                                rotation: parseInt(e.target.value)
                                            }
                                        })}
                                    />

                                    {/* Gredient Colour Stop & Single Ranged Selection Display with Add & Remove Other Stops (Min 2 Stops) */}
                                    <div className="item-Gradient">
                                        <Slider

                                            track={false}
                                            defaultValue={PreDefinedGredient.colorStops.map((stop) => stop.offset * 100)}
                                            value={State.QROptions.dotsOptions?.gradient?.colorStops.map((stop) => stop.offset * 100)}
                                            onChange={(_, value: any) => {
                                                handleChange("dotsOptions", {
                                                    ...State.QROptions.dotsOptions,
                                                    gradient: {
                                                        ...State.QROptions.dotsOptions?.gradient,
                                                        colorStops: State.QROptions.dotsOptions?.gradient?.colorStops.map((stop, index: any) => ({
                                                            ...stop,
                                                            offset: value[index] / 100
                                                        }))
                                                    }
                                                })
                                            }}
                                            sx={{
                                                width: "100%",
                                                marginBottom: "10px"
                                            }}
                                        />
                                        {
                                            State.QROptions.dotsOptions?.gradient?.colorStops.map((stop, index) => (
                                                <div key={index} className="item-Gradient-Stop">
                                                    <label
                                                        className="item"
                                                        style={{
                                                            backgroundColor: stop.color,
                                                            width: "50px",
                                                            height: "50px",
                                                        }}>
                                                        <input
                                                            className="Hide"
                                                            type="color"
                                                            value={stop.color}
                                                            onChange={(e) => handleChange("dotsOptions", {
                                                                ...State.QROptions.dotsOptions,
                                                                gradient: {
                                                                    ...State.QROptions.dotsOptions?.gradient,
                                                                    colorStops: State.QROptions.dotsOptions?.gradient?.colorStops.map((s, i) => i === index ? { ...s, color: e.target.value } : s)
                                                                }
                                                            })}
                                                        />
                                                    </label>
                                                    <Button
                                                        className="item"
                                                        variant="light"
                                                        onClick={() => handleChange("dotsOptions", {
                                                            ...State.QROptions.dotsOptions,
                                                            gradient: {
                                                                ...State.QROptions.dotsOptions?.gradient,
                                                                colorStops: State.QROptions.dotsOptions?.gradient?.colorStops.filter((_, i) => i !== index)
                                                            }
                                                        })}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))
                                        }
                                        <Button
                                            className="item"
                                            variant="light"
                                            onClick={() => handleChange("dotsOptions", {
                                                ...State.QROptions.dotsOptions,
                                                gradient: {
                                                    ...State.QROptions.dotsOptions?.gradient,
                                                    colorStops: [
                                                        ...State.QROptions.dotsOptions?.gradient?.colorStops ?? [],
                                                        {
                                                            offset: 0,
                                                            color: "#000000"
                                                        }
                                                    ]
                                                }
                                            })}
                                        >
                                            Add Stop
                                        </Button>
                                    </div>
                                </>)
                            }
                        </AccordionItem>

                        {/* Border */}
                        <AccordionItem
                            title="Border"
                            subtitle="Change QR Border Style & Color"
                        >
                            <Input
                                className="item"
                                type="range"
                                label={"Thickness"}
                                min="0"
                                max="100"
                                value={State.QRPluginOptions.thickness.toString()}
                                onChange={(e) => handleChangePlugin("thickness", parseInt(e.target.value))}
                            />

                            <div className="item-Download">
                                <label
                                    className="item"
                                    style={{
                                        backgroundColor: State.QRPluginOptions.color,
                                        width: "50px",
                                        height: "50px",
                                    }}>
                                    <input
                                        className="Hide"
                                        type="color"
                                        value={State.QRPluginOptions.color}
                                        onChange={(e) => handleChangePlugin("color", e.target.value)}
                                    />
                                </label>
                            </div>

                            <Input
                                className="item"
                                type="text"
                                label={"Top Text"}
                                value={State.QRPluginOptions.decorations.top.value}
                                onChange={(e) => handleChangePlugin("decorations", {
                                    ...State.QRPluginOptions.decorations,
                                    top: {
                                        ...State.QRPluginOptions.decorations.top,
                                        value: e.target.value
                                    }
                                })}
                            />

                            <Input
                                className="item"
                                type="text"
                                label={"Bottom Text"}
                                value={State.QRPluginOptions.decorations.bottom.value}
                                onChange={(e) => handleChangePlugin("decorations", {
                                    ...State.QRPluginOptions.decorations,
                                    bottom: {
                                        ...State.QRPluginOptions.decorations.bottom,
                                        value: e.target.value
                                    }
                                })}
                            />

                            <Input
                                className="item"
                                type="text"
                                label={"Left Text"}
                                value={State.QRPluginOptions.decorations.left.value}
                                onChange={(e) => handleChangePlugin("decorations", {
                                    ...State.QRPluginOptions.decorations,
                                    left: {
                                        ...State.QRPluginOptions.decorations.left,
                                        value: e.target.value
                                    }
                                })}
                            />

                            <Input
                                className="item"
                                type="text"
                                label={"Right Text"}
                                value={State.QRPluginOptions.decorations.right.value}
                                onChange={(e) => handleChangePlugin("decorations", {
                                    ...State.QRPluginOptions.decorations,
                                    right: {
                                        ...State.QRPluginOptions.decorations.right,
                                        value: e.target.value
                                    }
                                })}
                            />

                        </AccordionItem>


                        {/* @Settings */}
                        <AccordionItem
                            title="Settings"
                            subtitle="QR Additional Settings"
                        >
                            <Checkbox
                                className="item"
                                checked={State.BorderDesign}
                                onChange={(e) => setState({ ...State, BorderDesign: e.target.checked })}
                            >
                                Apply Border Style
                            </Checkbox>

                            <StyledToggleButtonGroup
                                className="item-CenterToggleButtons"
                                value={State.QROptions.qrOptions?.errorCorrectionLevel}
                                exclusive
                                sx={{
                                    // ? Modify All the Items Border-Radius
                                    '& .MuiToggleButtonGroup-firstButton': {
                                        borderRadius: "10px 0 0 10px",
                                    },
                                    '& .MuiToggleButtonGroup-lastButton': {
                                        borderRadius: "0 10px 10px 0",
                                    },
                                }}
                                onChange={(e, value) => {
                                    if (value === null) {
                                        return;
                                    }
                                    return handleChange("qrOptions", { ...State.QROptions.qrOptions, errorCorrectionLevel: value });
                                }}
                            >
                                <ToggleButton value="L">
                                    Low
                                </ToggleButton>
                                <ToggleButton value="M">
                                    Medium
                                </ToggleButton>
                                <ToggleButton value="Q">
                                    Quartile
                                </ToggleButton>
                                <ToggleButton value="H">
                                    High
                                </ToggleButton>
                            </StyledToggleButtonGroup>

                        </AccordionItem>
                        <AccordionItem
                            title="License"
                            subtitle="License Key of QR Border Plugin"
                        >
                            <div className="flex flex-col gap-1">
                                <div>
                                    <p className="item-description">
                                        Disclaimer: This License Key is generated for the Demo Purpose only. Please Purchase the License Key from the Official Website &nbsp;
                                        <Link className="text-accent" href="https://www.lefe.dev/marketplace/qr-border-plugin#pricing">Lefe</Link>.
                                    </p>
                                    <p className="item-description">
                                        This License Key is used to Activate the QR Border Plugin for the QR Code if you want to use on your website.
                                    </p>
                                </div>
                                <div className="item-License">
                                    <Input
                                        type="text"
                                        label={"License Key"}
                                        value={State.LicenseKey}
                                        onChange={(e) => setState({ ...State, LicenseKey: e.target.value })}
                                        isClearable
                                        onClear={() => setState({ ...State, LicenseKey: "" })}
                                    />
                                    <Button
                                        isIconOnly
                                        color="danger"
                                        aria-label="Like"
                                        onClick={RotateLicenseKey}
                                    >
                                        <WifiProtectedSetup />
                                    </Button>
                                </div>
                            </div>
                        </AccordionItem>

                        {/* @Import & Export */}
                        <AccordionItem
                            title="Import & Export"
                            subtitle="Import & Export QR Code Settings in JSON Format"
                        >
                            <ButtonGroup className="item-ImportExport">
                                <Button variant="light">Import</Button>
                                <Button variant="light">Export</Button>
                            </ButtonGroup>
                        </AccordionItem>

                        {/* @Download */}
                        <AccordionItem
                            title="Download"
                            subtitle="Download QR Code in Different Formats"
                        >
                            <div className="item-Download">
                                <StyledToggleButtonGroup
                                    value={State.FileExt}
                                    exclusive
                                    onChange={(e, value) => setState({ ...State, FileExt: value })}
                                    sx={{
                                        // ? Modify All the Items Border-Radius
                                        '& .MuiToggleButtonGroup-firstButton': {
                                            borderRadius: "10px 0 0 10px",
                                        },
                                        '& .MuiToggleButtonGroup-lastButton': {
                                            borderRadius: "0 10px 10px 0",
                                        },
                                    }}
                                >
                                    <ToggleButton value="svg">SVG</ToggleButton>
                                    <ToggleButton value="png">PNG</ToggleButton>
                                    <ToggleButton value="jpeg">JPEG</ToggleButton>
                                    <ToggleButton value="webp">WEBP</ToggleButton>
                                </StyledToggleButtonGroup>
                                <Button onClick={onDownloadClick} variant="light">
                                    <CloudDownload />
                                    Download
                                </Button>
                            </div>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div >
    );
}