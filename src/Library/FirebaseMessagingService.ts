/**
 * Firebase Cloud Messaging Service
 * 
 * Handles push notifications for Hardware Unlock:
 * - Challenge notifications to paired devices
 * - Approval status updates
 * - Device pairing confirmations
 */

import admin from "firebase-admin";
import { HardwareUnlockDevice } from "@/Models/HardwareUnlockDevice";
import { HardwareUnlockChallenge } from "@/Models/HardwareUnlockChallenge";

interface PushPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

interface MulticastMessage extends admin.messaging.MulticastMessage {
    tokens: string[];
}

class FirebaseMessagingService {
    private initialized: boolean = false;

    constructor() {
        this.initialize();
    }

    /**
     * Initialize Firebase Admin SDK
     */
    private initialize(): void {
        try {
            // Check if Firebase Admin SDK is already initialized
            if (admin.apps.length === 0) {
                const serviceAccount: any = {
                    apiKey: "AIzaSyAvsZa6nSJ1Sm97jsq3Fx5FA1ns329MTsY",
                    authDomain: "meetbhingradiya-f086c.firebaseapp.com",
                    projectId: "meetbhingradiya-f086c",
                    storageBucket: "meetbhingradiya-f086c.firebasestorage.app",
                    messagingSenderId: "682740515935",
                    appId: "1:682740515935:web:e3fbffad11084dbb4a47ea",
                    measurementId: "G-9BHBWMVJES"
                }

                if (!serviceAccount.project_id) {
                    console.warn("Firebase not configured - push notifications disabled");
                    this.initialized = false;
                    return;
                }

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
                });
            }

            this.initialized = true;
            console.log("Firebase Messaging Service initialized");
        } catch (error) {
            console.error("Firebase initialization error:", error);
            this.initialized = false;
        }
    }

    /**
     * Send challenge notification to a device
     * 
     * Triggers mobile app to display unlock approval UI
     */
    async sendChallengeNotification(
        deviceId: string,
        challengeId: string,
        action: string = "windows_unlock"
    ): Promise<boolean> {
        if (!this.initialized) {
            console.warn("Firebase not initialized, skipping push");
            return false;
        }

        try {
            // Get device FCM token
            const device = await HardwareUnlockDevice.findOne({ deviceId }, { fcmToken: 1 });
            if (!device || !device.fcmToken) {
                console.warn(`No FCM token for device ${deviceId}`);
                return false;
            }

            const payload: PushPayload = {
                title: "Security Unlock Request",
                body: "Approve unlock on your Windows PC with fingerprint or face",
                data: {
                    type: "challenge",
                    challengeId,
                    action,
                    timestamp: Date.now().toString()
                }
            };

            const message: admin.messaging.Message = {
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                data: payload.data,
                token: device.fcmToken,
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        channelId: "unlock_requests"
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            alert: {
                                title: payload.title,
                                body: payload.body
                            },
                            sound: "default",
                            badge: 1
                        }
                    }
                }
            };

            const messageId = await admin.messaging().send(message);
            console.log(`Challenge notification sent (${messageId}): ${deviceId}`);
            return true;
        } catch (error) {
            console.error("Send challenge notification error:", error);
            return false;
        }
    }

    /**
     * Send approval status update to Windows client
     * 
     * Notifies PC that challenge was approved
     */
    async sendApprovalNotification(challengeId: string): Promise<boolean> {
        if (!this.initialized) return false;

        try {
            const challenge = await HardwareUnlockChallenge.findOne({ challengeId });
            if (!challenge) return false;

            // In a real implementation, you'd have a notification token for the Windows client
            // For now, this is a placeholder - actual notification via WebSocket/Server-Sent Events
            console.log(`Approval notification for challenge: ${challengeId}`);
            return true;
        } catch (error) {
            console.error("Send approval notification error:", error);
            return false;
        }
    }

    /**
     * Send bulk notifications to multiple devices
     * 
     * Useful for notifying backup devices or admin users
     */
    async sendBulkNotification(
        deviceIds: string[],
        payload: PushPayload
    ): Promise<{ successCount: number; failureCount: number }> {
        if (!this.initialized) {
            return { successCount: 0, failureCount: deviceIds.length };
        }

        try {
            // Get FCM tokens for all devices
            const devices = await HardwareUnlockDevice.find(
                { deviceId: { $in: deviceIds }, isActive: true },
                { fcmToken: 1 }
            );

            const tokens = devices
                .map((d) => d.fcmToken)
                .filter((t) => t) as string[];

            if (tokens.length === 0) {
                console.warn("No valid FCM tokens found");
                return { successCount: 0, failureCount: deviceIds.length };
            }

            const message: MulticastMessage = {
                tokens,
                notification: {
                    title: payload.title,
                    body: payload.body
                },
                data: payload.data || {},
                android: {
                    priority: "high"
                }
            };

            // ! Need to use sendEachForMulticast to get individual success/failure counts
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`Bulk notification sent: ${response.successCount} success, ${response.failureCount} failed`);

            return {
                successCount: response.successCount,
                failureCount: response.failureCount
            };
        } catch (error) {
            console.error("Send bulk notification error:", error);
            return { successCount: 0, failureCount: deviceIds.length };
        }
    }

    /**
     * Subscribe device to topic
     * 
     * Useful for sending notifications to user's all devices
     */
    async subscribeToTopic(deviceId: string, topic: string): Promise<boolean> {
        if (!this.initialized) return false;

        try {
            const device = await HardwareUnlockDevice.findOne({ deviceId }, { fcmToken: 1 });
            if (!device || !device.fcmToken) return false;

            await admin.messaging().subscribeToTopic(device.fcmToken, topic);
            console.log(`Device subscribed to topic: ${deviceId} -> ${topic}`);
            return true;
        } catch (error) {
            console.error("Subscribe to topic error:", error);
            return false;
        }
    }

    /**
     * Unsubscribe device from topic
     */
    async unsubscribeFromTopic(deviceId: string, topic: string): Promise<boolean> {
        if (!this.initialized) return false;

        try {
            const device = await HardwareUnlockDevice.findOne({ deviceId }, { fcmToken: 1 });
            if (!device || !device.fcmToken) return false;

            await admin.messaging().unsubscribeFromTopic(device.fcmToken, topic);
            console.log(`Device unsubscribed from topic: ${deviceId} -> ${topic}`);
            return true;
        } catch (error) {
            console.error("Unsubscribe from topic error:", error);
            return false;
        }
    }

    /**
     * Check if Firebase is available
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

// Export singleton instance
export const firebaseMessaging = new FirebaseMessagingService();
