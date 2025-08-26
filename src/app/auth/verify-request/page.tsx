"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { FaEnvelope, FaHome, FaArrowLeft } from "react-icons/fa";
import { motion } from "motion/react";

export default function VerifyRequestPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <Card className="bg-black/40 backdrop-blur-lg border border-white/10">
                    <CardHeader className="text-center pb-4">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="p-3 rounded-full bg-primary/20 border border-primary">
                                <FaEnvelope className="text-primary text-2xl" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
                        </div>
                    </CardHeader>
                    <CardBody className="text-center space-y-6">
                        <div>
                            <p className="text-gray-300 text-lg">
                                A verification link has been sent to your email address.
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                Please check your inbox and click the link to complete the sign-in process.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <Button
                                color="primary"
                                variant="shadow"
                                fullWidth
                                onClick={() => router.push("/auth/signin")}
                                startContent={<FaArrowLeft />}
                            >
                                Back to Sign In
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
                                Didn&apos;t receive the email? Check your spam folder or try signing in again.
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
}
