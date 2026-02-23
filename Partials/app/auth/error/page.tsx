"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";
import { motion } from "motion/react";

const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification token has expired or has already been used.",
    Default: "An unexpected error occurred during authentication."
};

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const error = searchParams.get("error") || "Default";
    
    const errorMessage = errorMessages[error] || errorMessages.Default;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
        >
            <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                <CardHeader className="text-center pb-4">
                    <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 rounded-full bg-danger/20 border border-danger">
                            <FaExclamationTriangle className="text-danger text-2xl" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
                    </div>
                </CardHeader>
                <CardBody className="text-center space-y-6">
                    <div>
                        <p className="text-gray-300 text-lg">{errorMessage}</p>
                        {error !== "Default" && (
                            <p className="text-gray-500 text-sm mt-2">Error Code: {error}</p>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        <Button
                            color="primary"
                            variant="shadow"
                            fullWidth
                            onClick={() => router.push("/auth/signin")}
                            startContent={<FaArrowLeft />}
                        >
                            Try Again
                        </Button>
                        <Button
                            color="secondary"
                            variant="flat"
                            fullWidth
                            onClick={() => router.push("/")}
                            startContent={<FaHome />}
                        >
                            Go Home
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <p className="text-gray-500 text-sm">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </CardBody>
            </Card>
        </motion.div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
            <Suspense 
                fallback={
                    <div className="flex items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                }
            >
                <AuthErrorContent />
            </Suspense>
        </div>
    );
}
