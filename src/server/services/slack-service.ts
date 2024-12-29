import { env } from "@/env";
import { logger } from "@/lib/logger";

interface SlackMessage {
    text?: string;
    blocks?: {
        type: string;
        [key: string]: unknown;
    }[];
    attachments?: Record<string, unknown>[];
}

export class SlackService {
    private static async sendWebhook(
        webhookUrl: string,
        message: SlackMessage,
    ): Promise<boolean> {
        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (error) {
            logger.error("Failed to send Slack webhook:", error);
            return false;
        }
    }

    /**
     * Send a notification to a Slack channel
     */
    static async sendNotification(params: {
        message: string;
        channel?: string;
        username?: string;
        icon_emoji?: string;
        blocks?: {
            type: string;
            [key: string]: unknown;
        }[];
    }): Promise<boolean> {
        const webhookUrl = env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            logger.warn("Slack webhook URL not configured");
            return false;
        }

        return await this.sendWebhook(webhookUrl, {
            text: params.message,
            blocks: params.blocks,
        });
    }

    /**
     * Send a deployment notification
     */
    static async sendDeploymentNotification(params: {
        environment: string;
        version: string;
        status: "started" | "completed" | "failed";
        error?: string;
    }): Promise<boolean> {
        const emoji = {
            started: "🚀",
            completed: "✅",
            failed: "❌",
        }[params.status];

        const blocks = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `${emoji} *Deployment ${params.status}*\nEnvironment: ${params.environment}\nVersion: ${params.version}`,
                },
            },
        ];

        if (params.error) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Error:*\n\`\`\`${params.error}\`\`\``,
                },
            });
        }

        return await this.sendNotification({
            message: `Deployment ${params.status} for ${params.environment}`,
            blocks,
        });
    }

    /**
     * Send a security alert
     */
    static async sendSecurityAlert(params: {
        title: string;
        description: string;
        severity: "low" | "medium" | "high" | "critical";
        metadata?: Record<string, unknown>;
    }): Promise<boolean> {
        const severityColors = {
            low: "#2ECC71",
            medium: "#F1C40F",
            high: "#E67E22",
            critical: "#E74C3C",
        };

        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "🚨 Security Alert",
                },
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${params.title}*\n${params.description}`,
                },
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Severity: *${params.severity.toUpperCase()}*`,
                    },
                ],
            },
        ];

        if (params.metadata) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "```" + JSON.stringify(params.metadata, null, 2) + "```",
                },
            });
        }

        return await this.sendNotification({
            message: `Security Alert: ${params.title}`,
            blocks,
        });
    }

    /**
     * Send an error report
     */
    static async sendErrorReport(params: {
        error: Error;
        context?: Record<string, unknown>;
        user?: {
            id: string;
            email?: string;
        };
    }): Promise<boolean> {
        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "⚠️ Error Report",
                },
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Error:* ${params.error.message}\n\`\`\`${params.error.stack}\`\`\``,
                },
            },
        ];

        if (params.user) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*User:*\nID: ${params.user.id}${params.user.email ? `\nEmail: ${params.user.email}` : ""
                        }`,
                },
            });
        }

        if (params.context) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text:
                        "*Context:*\n```" + JSON.stringify(params.context, null, 2) + "```",
                },
            });
        }

        return await this.sendNotification({
            message: `Error: ${params.error.message}`,
            blocks,
        });
    }
}
