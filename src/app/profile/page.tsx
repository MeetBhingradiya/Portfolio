"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Avatar,
    Chip,
    Divider,
    Switch,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Select,
    SelectItem
} from "@heroui/react";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaLink,
    FaUnlink,
    FaEdit,
    FaSave,
    FaTimes,
    FaShieldAlt,
    FaCog
} from "react-icons/fa";
import {
    FaGoogle,
    FaGithub,
    FaDiscord,
    FaApple,
    FaFacebook,
    FaLinkedin,
    FaMicrosoft,
    FaInstagram,
    FaTwitter,
    FaSpotify,
    FaReddit,
    FaGitlab
} from "react-icons/fa";
import { Config } from "@Config";
import { Axios } from "@Utils/Axios";

interface UserProfile {
    UserID: string;
    Username: string;
    FirstName: string;
    LastName: string;
    DisplayName: string;
    Bio: string;
    Avatar: string;
    Website: string;
    Location: string;
    Emails: Array<{
        Email: string;
        isPrimary: boolean;
        isVerified: boolean;
    }>;
    role: string;
    accountType: string;
    preferences: any;
    createdAt: string; // Add missing createdAt property
}

interface ConnectedAccount {
    provider: string;
    email?: string;
    connectedAt: string;
    lastUsed: string;
}

const providerIcons: Record<string, any> = {
    google: FaGoogle,
    github: FaGithub,
    discord: FaDiscord,
    apple: FaApple,
    facebook: FaFacebook,
    linkedin: FaLinkedin,
    microsoft: FaMicrosoft,
    instagram: FaInstagram,
    twitter: FaTwitter,
    spotify: FaSpotify,
    reddit: FaReddit,
    gitlab: FaGitlab
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const [providerToDisconnect, setProviderToDisconnect] = useState<string>("");

    // Redirect if not authenticated
    useEffect(() => {
        if (status === "loading") return;
        if (status === "unauthenticated") {
            router.push("/auth/signin");
            return;
        }
    }, [status, router]);

    // Fetch profile data
    useEffect(() => {
        if (status !== "authenticated") return;

        const fetchProfileData = async () => {
            try {
                setIsLoading(true);
                const response = await Axios.get("/api/dashboard");
                
                if (response.data.Status === 1) {
                    setProfile(response.data.Data.user);
                    setConnectedAccounts(response.data.Data.connectedAccounts);
                    setEditForm(response.data.Data.user);
                } else {
                    setError(response.data.Message || "Failed to load profile data");
                }
            } catch (error: any) {
                setError(error.response?.data?.Message || "Failed to load profile data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [status]);

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await Axios.put("/api/profile", {
                firstName: editForm.FirstName,
                lastName: editForm.LastName,
                displayName: editForm.DisplayName,
                bio: editForm.Bio,
                website: editForm.Website,
                location: editForm.Location,
                preferences: editForm.preferences
            });

            if (response.data.Status === 1) {
                setProfile(response.data.Data.user);
                setSuccess("Profile updated successfully!");
                setIsEditing(false);
            } else {
                setError(response.data.Message || "Failed to update profile");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleConnectProvider = (provider: string) => {
        window.location.href = `/api/auth/connect/${provider}?callbackUrl=${encodeURIComponent("/profile")}`;
    };

    const handleDisconnectProvider = async (provider: string) => {
        try {
            const response = await Axios.post("/api/auth/disconnect", {
                provider
            });

            if (response.data.Status === 1) {
                setConnectedAccounts(prev => prev.filter(acc => acc.provider !== provider));
                setSuccess(`${provider} account disconnected successfully!`);
            } else {
                setError(response.data.Message || "Failed to disconnect provider");
            }
        } catch (error: any) {
            setError(error.response?.data?.Message || "Failed to disconnect provider");
        }
        onDeleteModalClose();
    };

    const confirmDisconnect = (provider: string) => {
        setProviderToDisconnect(provider);
        onDeleteModalOpen();
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
                <span className="ml-2">Loading profile...</span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardBody className="text-center">
                        <p className="text-danger">Failed to load profile data</p>
                        {error && <p className="text-sm text-danger mt-2">{error}</p>}
                        <Button 
                            className="mt-4" 
                            color="primary" 
                            onClick={() => router.push("/dashboard")}
                        >
                            Back to Dashboard
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div className="flex items-center space-x-4">
                        <Button
                            isIconOnly
                            variant="flat"
                            onClick={() => router.back()}
                        >
                            <FaTimes />
                        </Button>
                        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Chip color={profile.role === 'admin' ? 'danger' : 'primary'} variant="flat">
                            {profile.role}
                        </Chip>
                        <Chip color="secondary" variant="flat">
                            {profile.accountType}
                        </Chip>
                    </div>
                </motion.div>

                {/* Success/Error Messages */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-success/20 border border-success rounded-lg p-4"
                    >
                        <p className="text-success">{success}</p>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-danger/20 border border-danger rounded-lg p-4"
                    >
                        <p className="text-danger">{error}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Information */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2"
                    >
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <FaUser className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                                </div>
                                <Button
                                    color={isEditing ? "danger" : "primary"}
                                    variant="flat"
                                    onClick={() => {
                                        if (isEditing) {
                                            setEditForm(profile);
                                            setIsEditing(false);
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    startContent={isEditing ? <FaTimes /> : <FaEdit />}
                                >
                                    {isEditing ? "Cancel" : "Edit"}
                                </Button>
                            </CardHeader>
                            <CardBody className="space-y-6">
                                <div className="flex items-center space-x-6">
                                    <Avatar
                                        src={profile.Avatar}
                                        size="lg"
                                        name={profile.DisplayName}
                                        className="w-20 h-20"
                                    />
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">
                                            {profile.DisplayName}
                                        </h3>
                                        <p className="text-gray-400">@{profile.Username}</p>
                                        <p className="text-sm text-gray-500">
                                            Member since {new Date(profile.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <Divider />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="First Name"
                                        value={isEditing ? editForm.FirstName || "" : profile.FirstName}
                                        onChange={(e) => setEditForm({ ...editForm, FirstName: e.target.value })}
                                        isReadOnly={!isEditing}
                                        variant={isEditing ? "bordered" : "flat"}
                                    />
                                    <Input
                                        label="Last Name"
                                        value={isEditing ? editForm.LastName || "" : profile.LastName}
                                        onChange={(e) => setEditForm({ ...editForm, LastName: e.target.value })}
                                        isReadOnly={!isEditing}
                                        variant={isEditing ? "bordered" : "flat"}
                                    />
                                </div>

                                <Input
                                    label="Display Name"
                                    value={isEditing ? editForm.DisplayName || "" : profile.DisplayName}
                                    onChange={(e) => setEditForm({ ...editForm, DisplayName: e.target.value })}
                                    isReadOnly={!isEditing}
                                    variant={isEditing ? "bordered" : "flat"}
                                />

                                <Textarea
                                    label="Bio"
                                    placeholder="Tell us about yourself..."
                                    value={isEditing ? editForm.Bio || "" : profile.Bio}
                                    onChange={(e) => setEditForm({ ...editForm, Bio: e.target.value })}
                                    isReadOnly={!isEditing}
                                    variant={isEditing ? "bordered" : "flat"}
                                    maxLength={500}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Website"
                                        value={isEditing ? editForm.Website || "" : profile.Website}
                                        onChange={(e) => setEditForm({ ...editForm, Website: e.target.value })}
                                        isReadOnly={!isEditing}
                                        variant={isEditing ? "bordered" : "flat"}
                                        placeholder="https://your-website.com"
                                    />
                                    <Input
                                        label="Location"
                                        value={isEditing ? editForm.Location || "" : profile.Location}
                                        onChange={(e) => setEditForm({ ...editForm, Location: e.target.value })}
                                        isReadOnly={!isEditing}
                                        variant={isEditing ? "bordered" : "flat"}
                                        placeholder="City, Country"
                                    />
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            color="primary"
                                            onClick={handleSaveProfile}
                                            isLoading={isSaving}
                                            startContent={<FaSave />}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Connected Accounts */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaLink className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {Object.entries(Config.AuthProviders)
                                    .filter(([key, config]) => config.enabled)
                                    .map(([provider, config]) => {
                                    const isConnected = connectedAccounts.some(acc => acc.provider === provider);
                                    const IconComponent = providerIcons[provider];
                                    
                                    // Helper function to get proper display name
                                    const getProviderDisplayName = (providerKey: string) => {
                                        const displayNames: Record<string, string> = {
                                            google: "Google",
                                            github: "GitHub", 
                                            discord: "Discord",
                                            apple: "Apple",
                                            facebook: "Facebook",
                                            linkedin: "LinkedIn",
                                            microsoft: "Microsoft",
                                            instagram: "Instagram",
                                            twitter: "Twitter",
                                            spotify: "Spotify",
                                            reddit: "Reddit",
                                            gitlab: "GitLab",
                                            slack: "Slack",
                                            patreon: "Patreon",
                                            pinterest: "Pinterest",
                                            credentials: "Credentials",
                                            email: "Email"
                                        };
                                        return displayNames[providerKey] || providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
                                    };
                                    
                                    return (
                                        <div key={provider} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                            <div className="flex items-center space-x-3">
                                                {IconComponent && <IconComponent className="text-xl" />}
                                                <div>
                                                    <p className="font-medium text-white">{getProviderDisplayName(provider)}</p>
                                                    {isConnected && (
                                                        <p className="text-sm text-gray-400">Connected</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                color={isConnected ? "danger" : "primary"}
                                                variant="flat"
                                                onClick={() => {
                                                    if (isConnected) {
                                                        confirmDisconnect(provider);
                                                    } else {
                                                        handleConnectProvider(provider);
                                                    }
                                                }}
                                                startContent={isConnected ? <FaUnlink /> : <FaLink />}
                                            >
                                                {isConnected ? "Disconnect" : "Connect"}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </CardBody>
                        </Card>

                        {/* Security Card */}
                        <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                            <CardHeader>
                                <div className="flex items-center space-x-2">
                                    <FaShieldAlt className="text-primary" />
                                    <h2 className="text-xl font-semibold text-white">Security</h2>
                                </div>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-white">Two-Factor Authentication</p>
                                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                                    </div>
                                    <Switch size="sm" />
                                </div>
                                <Divider />
                                <Button
                                    color="primary"
                                    variant="flat"
                                    fullWidth
                                    startContent={<FaLock />}
                                >
                                    Change Password
                                </Button>
                            </CardBody>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Disconnect Provider Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
                <ModalContent>
                    <ModalHeader>Disconnect Provider</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to disconnect your {providerToDisconnect} account?</p>
                        <p className="text-sm text-gray-500 mt-2">
                            You won&apos;t be able to sign in using {providerToDisconnect} after disconnecting.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onDeleteModalClose}>
                            Cancel
                        </Button>
                        <Button
                            color="danger"
                            onPress={() => handleDisconnectProvider(providerToDisconnect)}
                        >
                            Disconnect
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
