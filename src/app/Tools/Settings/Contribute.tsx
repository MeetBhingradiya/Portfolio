import React from "react";
import { AutoFixHigh, Delete, Link, GitHub, Shield } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { Button } from "@heroui/react";
import { RiExternalLinkFill } from "react-icons/ri";

function NotionIcon() {
    return (
        <svg
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10">
            <g clipPath="url(#a)">
                <mask
                    id="b"
                    width="29"
                    height="30"
                    x="0"
                    y="0"
                    maskUnits="userSpaceOnUse">
                    <path
                        fill="#fff"
                        d="M28.714 0H0v29.995h28.714V0Z"
                    />
                </mask>
                <g mask="url(#b)">
                    <path
                        fill="#fff"
                        d="M1.805 1.29 18.403.069c2.038-.175 2.563-.057 3.844.873l5.298 3.724c.874.64 1.166.815 1.166 1.513v20.424c0 1.28-.467 2.037-2.097 2.153L7.34 29.919c-1.224.058-1.806-.116-2.447-.931L.99 23.925c-.7-.931-.99-1.628-.99-2.444V3.326c0-1.046.466-1.92 1.805-2.035Z"
                    />
                    <path
                        fill="#000"
                        fillRule="evenodd"
                        d="M18.403.068 1.805 1.291C.466 1.406 0 2.28 0 3.326v18.155c0 .816.29 1.513.99 2.444l3.902 5.063c.64.815 1.223.99 2.447.93l19.275-1.163c1.63-.116 2.097-.873 2.097-2.153V6.178c0-.662-.262-.853-1.034-1.416a89.567 89.567 0 0 1-.132-.097L22.247.941C20.966.011 20.44-.107 18.403.068ZM7.776 5.843c-1.574.106-1.931.13-2.825-.596L2.678 3.443c-.232-.233-.115-.524.467-.581l15.957-1.164c1.339-.117 2.038.35 2.562.756l2.737 1.979c.116.058.407.407.058.407l-16.48.99-.203.013ZM5.94 26.427V9.087c0-.756.233-1.105.932-1.164l18.926-1.105c.642-.058.933.35.933 1.105v17.223c0 .758-.117 1.398-1.166 1.456L7.455 27.65c-1.05.058-1.515-.29-1.515-1.223Zm17.88-16.41c.116.525 0 1.049-.526 1.108l-.872.174v12.8c-.758.408-1.457.64-2.039.64-.932 0-1.165-.29-1.864-1.163l-5.707-8.96v8.67l1.806.407s0 1.047-1.458 1.047l-4.017.233c-.117-.233 0-.815.408-.931l1.048-.29V12.287l-1.456-.117c-.116-.524.174-1.28.99-1.338l4.31-.29 5.94 9.077v-8.03l-1.514-.174c-.117-.641.349-1.107.931-1.164l4.02-.234Z"
                        clipRule="evenodd"
                    />
                </g>
            </g>
            <defs>
                <clipPath id="a">
                    <path
                        fill="#fff"
                        d="M0 0h104.229v30H0z"
                    />
                </clipPath>
            </defs>
        </svg>
    );
}

function Contribute() {
    return (
        <div className="flex flex-col gap-6 w-full mx-auto">
            <div className="flex flex-col gap-2 justify-center items-center">
                <Typography
                    variant="h1"
                    className="font-bold text-6xl">
                    <AutoFixHigh fontSize="inherit" />
                </Typography>
                <Typography
                    variant="h4"
                    className="font-bold text-lg">
                    Contribute & Control
                </Typography>
                <Typography
                    variant="body1"
                    className="text-gray-500 text-sm">
                    Help us improve the app by contributing to our marketplace.
                </Typography>
            </div>

            <div className="flex flex-col gap-2">
                <iframe
                    className="border border-gray-800 rounded-lg hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300"
                    src="https://snehcreation.notion.site/ebd/1fb3c85b8b6f8076b968ebea65fff792"
                    width="100%"
                    height="1300"
                    frameBorder="0"
                    allowFullScreen
                />

                <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row gap-2">
                            <NotionIcon />
                            <div className="flex flex-col">
                                <p className="font-medium text-white text-sm">
                                    Notion Form - Request Website List on
                                    Marketplace
                                </p>
                                <p className="text-xs">
                                    Fill out the form to contribute to our
                                    marketplace.
                                </p>
                            </div>
                        </div>
                        <Button
                            startContent={<RiExternalLinkFill />}
                            onPress={() => {
                                window.open(
                                    "https://www.notion.so/snehcreation/1fb3c85b8b6f8076b968ebea65fff792?pvs=106",
                                    "_blank"
                                );
                            }}>
                            Link
                        </Button>
                    </div>
                </div>

                <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row gap-2">
                            <GitHub
                                fontSize="large"
                                sx={{ color: "#fff" }}
                            />
                            <div className="flex flex-col">
                                <p className="font-medium text-white text-sm">
                                    Github - Issues
                                </p>
                                <p className="text-xs">
                                    Report bugs or request features on our
                                    GitHub repository.
                                </p>
                            </div>
                        </div>
                        <Button
                            startContent={<RiExternalLinkFill />}
                            onPress={() => {
                                window.open(
                                    "https://github.com/MeetBhingradiya/Portfolio/issues/new?template=bug_report.yml",
                                    "_blank"
                                );
                            }}>
                            Link
                        </Button>
                    </div>
                </div>

                <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                    <div className="flex flex-row justify-between items-center">
                        <div className="flex flex-row gap-2">
                            <GitHub
                                fontSize="large"
                                sx={{ color: "#fff" }}
                            />
                            <div className="flex flex-col">
                                <p className="font-medium text-white text-sm">
                                    Github - Future Request
                                </p>
                                <p className="text-xs">
                                    Suggest new features or improvements for the
                                    app.
                                </p>
                            </div>
                        </div>
                        <Button
                            startContent={<RiExternalLinkFill />}
                            onPress={() => {
                                window.open(
                                    "https://github.com/MeetBhingradiya/Portfolio/issues/new?template=future_request.yml",
                                    "_blank"
                                );
                            }}>
                            Link
                        </Button>
                    </div>
                </div>

                {!localStorage.getItem("AdminOptions") ? (
                    <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                        <div className="flex flex-row justify-between items-center">
                            <div className="flex flex-row gap-2">
                                <Shield
                                    fontSize="large"
                                    sx={{ color: "#fff" }}
                                />
                                <div className="flex flex-col">
                                    <p className="font-medium text-white text-sm">
                                        Admin Options
                                    </p>
                                    <p className="text-xs">
                                        Enable admin options for the website on
                                        Client side.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onPress={() => {
                                    localStorage.setItem(
                                        "AdminOptions",
                                        "true"
                                    );
                                }}>
                                Enable
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-600/30 backdrop-blur-md shadow-md text-gray-500 hover:text-gray-200 transition-all duration-300">
                        <div className="flex flex-row justify-between items-center">
                            <div className="flex flex-row gap-2">
                                <Shield
                                    fontSize="large"
                                    sx={{ color: "#fff" }}
                                />
                                <div className="flex flex-col">
                                    <p className="font-medium text-white text-sm">
                                        Admin Options
                                    </p>
                                    <p className="text-xs">
                                        Disable admin options for the website on
                                        Client side.
                                    </p>
                                </div>
                            </div>
                            <Button
                                onPress={() => {
                                    localStorage.removeItem("AdminOptions");
                                }}>
                                Disable
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Contribute;
