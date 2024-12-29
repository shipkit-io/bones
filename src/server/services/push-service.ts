import { env } from "@/env";
import { logger } from "@/lib/logger";
import { db } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import webpush from "web-push";

// Initialize web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        `mailto:${env.SUPPORT_EMAIL}`,
        env.VAPID_PUBLIC_KEY,
        env.VAPID_PRIVATE_KEY,
    );
}

export interface PushNotification {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: Record<string, unknown>;
    actions?: {
        action: string;
        title: string;
        icon?: string;
    }[];
    tag?: string;
    requireInteraction?: boolean;
    renotify?: boolean;
    silent?: boolean;
    timestamp?: number;
}

export class PushService {
    /**
     * Save a new push subscription for a user
     */
    static async saveSubscription(params: {
        userId: string;
        subscription: PushSubscription;
    }) {
        try {
            const [result] = await db
                .insert(pushSubscriptions)
                .values({
                    userId: params.userId,
                    endpoint: params.subscription.endpoint,
                    p256dh: params.subscription.keys.p256dh,
                    auth: params.subscription.keys.auth,
                })
                .onConflictDoUpdate({
                    target: [pushSubscriptions.endpoint],
                    set: {
                        p256dh: params.subscription.keys.p256dh,
                        auth: params.subscription.keys.auth,
                        updatedAt: new Date(),
                    },
                })
                .returning();

            return result;
        } catch (error) {
            logger.error("Failed to save push subscription:", error);
            throw new Error("Failed to save push subscription");
        }
    }

    /**
     * Remove a push subscription
     */
    static async removeSubscription(endpoint: string) {
        try {
            await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.endpoint, endpoint));
        } catch (error) {
            logger.error("Failed to remove push subscription:", error);
            throw new Error("Failed to remove push subscription");
        }
    }

    /**
     * Send a push notification to a specific user
     */
    static async sendToUser(params: {
        userId: string;
        notification: PushNotification;
    }) {
        try {
            const subscriptions = await db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.userId, params.userId));

            const results = await Promise.allSettled(
                subscriptions.map((subscription) =>
                    webpush
                        .sendNotification(
                            {
                                endpoint: subscription.endpoint,
                                keys: {
                                    p256dh: subscription.p256dh,
                                    auth: subscription.auth,
                                },
                            },
                            JSON.stringify(params.notification),
                        )
                        .catch(async (error) => {
                            if (error.statusCode === 410) {
                                // Subscription has expired or is no longer valid
                                await this.removeSubscription(subscription.endpoint);
                            }
                            throw error;
                        }),
                ),
            );

            // Check results and handle any errors
            results.forEach((result, index) => {
                if (result.status === "rejected") {
                    logger.error(
                        `Failed to send push notification to subscription ${index}:`,
                        result.reason,
                    );
                }
            });

            return results.some((result) => result.status === "fulfilled");
        } catch (error) {
            logger.error("Failed to send push notification:", error);
            return false;
        }
    }

    /**
     * Send a push notification to multiple users
     */
    static async sendToUsers(params: {
        userIds: string[];
        notification: PushNotification;
    }) {
        const results = await Promise.allSettled(
            params.userIds.map((userId) =>
                this.sendToUser({ userId, notification: params.notification }),
            ),
        );

        return results.filter((result) => result.status === "fulfilled").length;
    }

    /**
     * Send a broadcast push notification to all subscribed users
     */
    static async broadcast(notification: PushNotification) {
        try {
            const subscriptions = await db.select().from(pushSubscriptions);

            const results = await Promise.allSettled(
                subscriptions.map((subscription) =>
                    webpush
                        .sendNotification(
                            {
                                endpoint: subscription.endpoint,
                                keys: {
                                    p256dh: subscription.p256dh,
                                    auth: subscription.auth,
                                },
                            },
                            JSON.stringify(notification),
                        )
                        .catch(async (error) => {
                            if (error.statusCode === 410) {
                                // Subscription has expired or is no longer valid
                                await this.removeSubscription(subscription.endpoint);
                            }
                            throw error;
                        }),
                ),
            );

            return results.filter((result) => result.status === "fulfilled").length;
        } catch (error) {
            logger.error("Failed to broadcast push notification:", error);
            return 0;
        }
    }
}
