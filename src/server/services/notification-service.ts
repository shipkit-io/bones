import { logger } from "@/lib/logger";
import { EmailService } from "@/server/services/email-service";
import { PushService } from "@/server/services/push-service";
import { SlackService } from "@/server/services/slack-service";
import { SMSService } from "@/server/services/sms-service";

export type NotificationChannel = "email" | "sms" | "push" | "slack";

export interface NotificationPreferences {
	channels: Partial<Record<NotificationChannel, boolean>>;
	phone?: string;
	email?: string;
}

export interface NotificationOptions {
	title: string;
	message: string;
	type?: "info" | "success" | "warning" | "error";
	channels?: NotificationChannel[];
	data?: Record<string, unknown>;
	user?: {
		id: string;
		preferences?: NotificationPreferences;
	};
}

export class NotificationService {
	/**
	 * Send a notification through multiple channels
	 */
	static async send(options: NotificationOptions): Promise<{
		success: boolean;
		results: Record<NotificationChannel, boolean>;
	}> {
		const channels = options.channels ?? ["email"];
		const results: Record<NotificationChannel, boolean> = {
			email: false,
			sms: false,
			push: false,
			slack: false,
		};

		try {
			await Promise.all(
				channels.map(async (channel) => {
					// Skip if user has disabled this channel
					if (
						options.user?.preferences?.channels &&
						options.user.preferences.channels[channel] === false
					) {
						logger.info(
							`Skipping ${channel} notification - disabled by user preferences`,
						);
						return;
					}

					try {
						results[channel] = await this.sendToChannel(channel, options);
					} catch (error) {
						logger.error(`Failed to send ${channel} notification:`, error);
						results[channel] = false;
					}
				}),
			);

			const success = Object.values(results).some((result) => result);
			return { success, results };
		} catch (error) {
			logger.error("Failed to send notifications:", error);
			return { success: false, results };
		}
	}

	/**
	 * Send a notification through a specific channel
	 */
	private static async sendToChannel(
		channel: NotificationChannel,
		options: NotificationOptions,
	): Promise<boolean> {
		switch (channel) {
			case "email":
				if (!options.user?.preferences?.email) return false;
				return await EmailService.sendNotification({
					to: options.user.preferences.email,
					subject: options.title,
					message: options.message,
					actionUrl: options.data?.actionUrl as string,
					actionText: options.data?.actionText as string,
				});

			case "sms":
				if (!options.user?.preferences?.phone) return false;
				return await SMSService.sendNotification({
					to: options.user.preferences.phone,
					message: options.message,
					type: options.type,
				});

			case "push":
				if (!options.user?.id) return false;
				return await PushService.sendToUser({
					userId: options.user.id,
					notification: {
						title: options.title,
						body: options.message,
						data: options.data,
					},
				});

			case "slack":
				return await SlackService.sendNotification({
					message: options.message,
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: `*${options.title}*\n${options.message}`,
							},
						},
					],
				});

			default:
				logger.warn(`Unknown notification channel: ${channel}`);
				return false;
		}
	}

	/**
	 * Send a security alert through all available channels
	 */
	static async sendSecurityAlert(params: {
		title: string;
		description: string;
		severity: "low" | "medium" | "high" | "critical";
		metadata?: Record<string, unknown>;
		user?: {
			id: string;
			preferences?: NotificationPreferences;
		};
	}): Promise<boolean> {
		try {
			const [emailResult, smsResult, pushResult, slackResult] =
				await Promise.allSettled([
					// Email notification
					params.user?.preferences?.email &&
						params.user.preferences.channels?.email !== false
						? EmailService.sendNotification({
							to: params.user.preferences.email,
							subject: `Security Alert: ${params.title}`,
							message: params.description,
						})
						: Promise.resolve(false),

					// SMS notification
					params.user?.preferences?.phone &&
						params.user.preferences.channels?.sms !== false
						? SMSService.sendSecurityAlert({
							to: params.user.preferences.phone,
							message: `${params.title}: ${params.description}`,
						})
						: Promise.resolve(false),

					// Push notification
					params.user?.id && params.user.preferences?.channels?.push !== false
						? PushService.sendToUser({
							userId: params.user.id,
							notification: {
								title: "Security Alert",
								body: params.description,
								data: {
									type: "security_alert",
									severity: params.severity,
									metadata: params.metadata,
								},
							},
						})
						: Promise.resolve(false),

					// Slack notification
					params.user?.preferences?.channels?.slack !== false
						? SlackService.sendSecurityAlert({
							title: params.title,
							description: params.description,
							severity: params.severity,
							metadata: params.metadata,
						})
						: Promise.resolve(false),
				]);

			// Check if at least one notification was sent successfully
			return [emailResult, smsResult, pushResult, slackResult].some(
				(result) => result.status === "fulfilled" && result.value,
			);
		} catch (error) {
			logger.error("Failed to send security alert:", error);
			return false;
		}
	}

	/**
	 * Send a system notification to all users
	 */
	static async broadcast(options: Omit<NotificationOptions, "user">) {
		try {
			const results = await Promise.allSettled([
				// Email broadcast (if implemented)
				// SMSService.broadcast (if implemented)
				PushService.broadcast({
					title: options.title,
					body: options.message,
					data: options.data,
				}),
				SlackService.sendNotification({
					message: options.message,
					blocks: [
						{
							type: "section",
							text: {
								type: "mrkdwn",
								text: `*${options.title}*\n${options.message}`,
							},
						},
					],
				}),
			]);

			return results.some(
				(result) => result.status === "fulfilled" && result.value,
			);
		} catch (error) {
			logger.error("Failed to broadcast notification:", error);
			return false;
		}
	}
}
