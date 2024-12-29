import { env } from "@/env";
import { logger } from "@/lib/logger";
import { Twilio } from "twilio";

// Initialize Twilio client
const twilioClient =
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
        ? new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
        : null;

export class SMSService {
    /**
     * Send a verification code via SMS
     */
    static async sendVerificationCode(params: {
        to: string;
        code: string;
    }): Promise<boolean> {
        try {
            if (!twilioClient) {
                logger.warn("Twilio client not initialized - SMS features disabled");
                return false;
            }

            await twilioClient.messages.create({
                to: params.to,
                from: env.TWILIO_PHONE_NUMBER,
                body: `Your ${env.NEXT_PUBLIC_APP_NAME} verification code is: ${params.code}`,
            });

            return true;
        } catch (error) {
            logger.error("Failed to send SMS verification code:", error);
            return false;
        }
    }

    /**
     * Send a security alert via SMS
     */
    static async sendSecurityAlert(params: {
        to: string;
        message: string;
    }): Promise<boolean> {
        try {
            if (!twilioClient) {
                logger.warn("Twilio client not initialized - SMS features disabled");
                return false;
            }

            await twilioClient.messages.create({
                to: params.to,
                from: env.TWILIO_PHONE_NUMBER,
                body: `🔐 Security Alert: ${params.message}`,
            });

            return true;
        } catch (error) {
            logger.error("Failed to send security alert SMS:", error);
            return false;
        }
    }

    /**
     * Send a notification via SMS
     */
    static async sendNotification(params: {
        to: string;
        message: string;
        type?: "info" | "warning" | "success";
    }): Promise<boolean> {
        try {
            if (!twilioClient) {
                logger.warn("Twilio client not initialized - SMS features disabled");
                return false;
            }

            const icon = {
                info: "ℹ️",
                warning: "⚠️",
                success: "✅",
            }[params.type ?? "info"];

            await twilioClient.messages.create({
                to: params.to,
                from: env.TWILIO_PHONE_NUMBER,
                body: `${icon} ${params.message}`,
            });

            return true;
        } catch (error) {
            logger.error("Failed to send notification SMS:", error);
            return false;
        }
    }
}
