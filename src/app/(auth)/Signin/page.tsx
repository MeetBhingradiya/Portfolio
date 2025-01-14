/**
 *  @FileID          app\(auth)\signin\page.tsx
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */

"use client";

import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Input,
    InputOtp,
    Alert
} from "@nextui-org/react";
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import {
    Check,
    Settings,
    GroupAdd,
    VideoLabel,
    PersonAdd,
    Person,
    AlternateEmail,
    Visibility,
    VisibilityOff,
    Password,
    Verified,
    Fingerprint,
    Shield,
    Warning
} from "@mui/icons-material"
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';

// ? MUI Step Utils
const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 10,
        left: 'calc(-50% + 16px)',
        right: 'calc(50% + 16px)',
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#784af4',
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: '#784af4',
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: '#eaeaf0',
        borderTopWidth: 3,
        borderRadius: 1,
        ...theme.applyStyles('dark', {
            borderColor: theme.palette.grey[800],
        }),
    },
}));

const QontoStepIconRoot = styled('div')<{ ownerState: { active?: boolean } }>(
    ({ theme }) => ({
        color: '#eaeaf0',
        display: 'flex',
        height: 22,
        alignItems: 'center',
        '& .QontoStepIcon-completedIcon': {
            color: '#784af4',
            zIndex: 1,
            fontSize: 18,
        },
        '& .QontoStepIcon-circle': {
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
        },
        ...theme.applyStyles('dark', {
            color: theme.palette.grey[700],
        }),
        variants: [
            {
                props: ({ ownerState }) => ownerState.active,
                style: {
                    color: '#784af4',
                },
            },
        ],
    }),
);

function QontoStepIcon(props: StepIconProps) {
    const { active, completed, className } = props;

    return (
        <QontoStepIconRoot ownerState={{ active }} className={className}>
            {completed ? (
                <Check className="QontoStepIcon-completedIcon" />
            ) : (
                <div className="QontoStepIcon-circle" />
            )}
        </QontoStepIconRoot>
    );
}

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage:
                // 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
                'var(--background-solid)',
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage:
                // 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
                'var(--background-solid)',
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: '#eaeaf0',
        borderRadius: 1,
        ...theme.applyStyles('dark', {
            backgroundColor: theme.palette.grey[800],
        }),
    },
}));

const ColorlibStepIconRoot = styled('div')<{
    ownerState: { completed?: boolean; active?: boolean };
}>(({ theme }) => ({
    backgroundColor: '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.applyStyles('dark', {
        backgroundColor: theme.palette.grey[700],
    }),
    variants: [
        {
            props: ({ ownerState }) => ownerState.active,
            style: {
                backgroundImage:
                    'var(--background-solid)',
                // backgroundImage:
                //     'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
                boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
            },
        },
        {
            props: ({ ownerState }) => ownerState.completed,
            style: {
                backgroundImage:
                    'var(--background-solid)',
                // 'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
            },
        },
    ],
}));

// ? Staps Data
function ColorlibStepIcon(props: StepIconProps) {
    const { active, completed, className } = props;

    const icons: { [index: string]: React.ReactElement<unknown> } = {
        1: <Person />,
        2: <AlternateEmail />,
        3: <Shield />,
        4: <Verified />,
        5: <Fingerprint />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {icons[String(props.icon)]}
        </ColorlibStepIconRoot>
    );
}

const steps = [
    'Basic Info',
    'Email',
    'Security',
    'Activate Account',
    'Username'
];

interface IState {
    // ? Step 1 : Basic Info
    Fname: string;
    Lname: string;
    Gender: string;

    // ? Step 2 : Email
    Email: string;
    S2_isERROR: boolean
    S2_Message: string

    // ? Step 3 : Create Password
    Password: string;
    S3_isERROR: boolean
    S3_Message: string

    // ? Step 4 : Verify Email
    Otp: string;
    OtpTrys: number
    S4_isERROR: boolean
    S4_Message: string

    // ? Step 5 : Create Username
    Username: string
    S5_isERROR: boolean
    S5_Message: string
}

export default function SignUp() {
    const { isOpen, onOpen } = useDisclosure();
    const [State, setState] = React.useState<IState>({
        Fname: "",
        Lname: "",
        Gender: "Female",

        Email: "",
        S2_isERROR: true,
        S2_Message: "Invalid Email",

        Password: "",
        S3_isERROR: false,
        S3_Message: "Invalid Password",

        Otp: "",
        OtpTrys: 0,
        S4_isERROR: false,
        S4_Message: "Invalid One Time Password",

        Username: "",
        S5_isERROR: false,
        S5_Message: "Invalid Username",
    });
    const [ActiveStep, setActiveStep] = React.useState(0);

    React.useEffect(() => {
        onOpen();
    }, [])

    function getEmailErrors() {
        // ? Not be Empty
        if (State.Email === "") {
            setState({ ...State, S2_isERROR: true, S2_Message: "Email is Required" });
            return;
        }

        // ? Whitelisted Domain
        // ? Gmail & Outlook & Yahoo
        const Domain = State.Email.split("@")[1];
        if (Domain !== "gmail.com" && Domain !== "outlook.com" && Domain !== "yahoo.com") {
            setState({ ...State, S2_isERROR: true, S2_Message: "Invalid Domain" });
            return;
        }

        // ? Not be Already Registered
        // Todo: DB Check with API
    }

    return (
        <div className="Page CENTER">
            <Modal
                isOpen={isOpen}
                size={"2xl"}
                onClose={() => { }}
                isDismissable={false}
                isKeyboardDismissDisabled={false}
                closeButton={false}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-row items-center gap-4 justify-center">
                        <PersonAdd />
                        Login Account
                    </ModalHeader>
                    <ModalBody className="flex flex-col gap-5">
                        <Stack sx={{ width: '100%' }} spacing={4}>
                            <Stepper alternativeLabel activeStep={ActiveStep} connector={<ColorlibConnector />}>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                        </Stack>
                        {
                            ActiveStep === 0 && (<div className="flex flex-col gap-5 p-10">
                                <div className="flex flex-row gap-3 items-center justify-center">
                                    <Input
                                        label="First Name"
                                        startContent={<Person />}
                                        value={State.Fname}
                                        onChange={(e) => setState({ ...State, Fname: e.target.value })}
                                    />
                                    <Input
                                        label="Last Name"
                                        startContent={<Person />}
                                        value={State.Lname}
                                        onChange={(e) => setState({ ...State, Lname: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-row gap-3 items-center justify-center">
                                    <Input
                                        label="Gender"
                                        startContent={<Person />}
                                        value={State.Fname}
                                        onChange={(e) => setState({ ...State, Fname: e.target.value })}
                                    />
                                </div>
                            </div>)
                        }
                        {
                            ActiveStep === 1 && (
                                <div className="flex flex-col gap-5 p-10">
                                    {
                                        State.S2_isERROR && (
                                            <Alert 
                                            description={`${State.S2_Message}`} 
                                            title={`ERROR`} 
                                            color="danger" 
                                            />
                                        )
                                    }
                                    <div className="flex flex-row gap-3 items-center justify-center">
                                        <Input
                                            label="Email"
                                            startContent={<AlternateEmail />}
                                            value={State.Email}
                                            onChange={(e) => setState({ ...State, Email: e.target.value })}
                                        />
                                    </div>
                                    {/* Email Checker Labels After Lab Checks */}
                                    {/* 
                                    
                                        * Not be Empty
                                        * spefic Whitelisted Domain
                                        * Not be Already Registered
                                     */}
                                    
                                </div>
                            )
                        }
                        {
                            ActiveStep === 2 && (<div>Step 3</div>)
                        }
                        {
                            ActiveStep === 3 && (<div>Step 4</div>)
                        }
                        {
                            ActiveStep === 4 && (<div>Step 5</div>)
                        }
                    </ModalBody>
                    <ModalFooter>
                        {
                            ActiveStep > 0 && (
                                <Button
                                    onPress={() => setActiveStep(ActiveStep - 1)}
                                >
                                    Previous
                                </Button>
                            )
                        }

                        {
                            ActiveStep < 4 && (
                                <Button
                                    onPress={() => setActiveStep(ActiveStep + 1)}
                                >
                                    Next
                                </Button>
                            )
                        }

                        {
                            ActiveStep >= 4 && (
                                <Button
                                    onPress={() => { }}
                                >
                                    Go Dashbord
                                </Button>
                            )
                        }
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}