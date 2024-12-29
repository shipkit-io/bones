/**
 * Activity Log Constants and Types
 *
 * This file contains all the constants and types used for activity logging
 * throughout the application.
 */

export const ActivityCategory = {
	AUTH: "auth",
	TEAM: "team",
	RESOURCE: "resource",
	SYSTEM: "system",
	SALES: "sales",
} as const;

export const ActivitySeverity = {
	INFO: "info",
	WARNING: "warning",
	ERROR: "error",
	CRITICAL: "critical",
} as const;

export const ActivityAction = {
	// Authentication actions
	USER_SIGNUP: "user.signup",
	USER_LOGIN: "user.login",
	USER_LOGOUT: "user.logout",
	PASSWORD_RESET_REQUEST: "user.password.reset.request",
	PASSWORD_RESET_COMPLETE: "user.password.reset.complete",
	EMAIL_VERIFICATION_REQUEST: "user.email.verify.request",
	EMAIL_VERIFICATION_COMPLETE: "user.email.verify.complete",
	ACCOUNT_UPDATE: "user.account.update",
	ACCOUNT_DELETE: "user.account.delete",

	// Lemon Squeezy
	ORDER_CREATED: "order.created",

	// Team actions
	TEAM_CREATE: "team.create",
	TEAM_UPDATE: "team.update",
	TEAM_DELETE: "team.delete",
	TEAM_MEMBER_INVITE: "team.member.invite",
	TEAM_MEMBER_JOIN: "team.member.join",
	TEAM_MEMBER_LEAVE: "team.member.leave",
	TEAM_MEMBER_REMOVE: "team.member.remove",
	TEAM_ROLE_UPDATE: "team.role.update",
	TEAM_PERMISSION_UPDATE: "team.permission.update",

	// Resource actions
	RESOURCE_CREATE: "resource.create",
	RESOURCE_UPDATE: "resource.update",
	RESOURCE_DELETE: "resource.delete",
	RESOURCE_SHARE: "resource.share",
	RESOURCE_UNSHARE: "resource.unshare",
	API_KEY_CREATE: "api.key.create",
	API_KEY_DELETE: "api.key.delete",
	CONFIG_UPDATE: "config.update",
	BACKUP_CREATE: "backup.create",
	BACKUP_RESTORE: "backup.restore",

	// System events
	SYSTEM_STATUS_CHANGE: "system.status.change",
	SYSTEM_PERFORMANCE_ALERT: "system.performance.alert",
	SYSTEM_SECURITY_ALERT: "system.security.alert",
	SYSTEM_ERROR: "system.error",
	SYSTEM_MAINTENANCE_START: "system.maintenance.start",
	SYSTEM_MAINTENANCE_END: "system.maintenance.end",
	API_RATE_LIMIT_WARNING: "api.rate.limit.warning",
	API_RATE_LIMIT_EXCEEDED: "api.rate.limit.exceeded",
} as const;

// Type definitions
export type ActivityCategoryType =
	(typeof ActivityCategory)[keyof typeof ActivityCategory];
export type ActivitySeverityType =
	(typeof ActivitySeverity)[keyof typeof ActivitySeverity];
export type ActivityActionType =
	(typeof ActivityAction)[keyof typeof ActivityAction];

export interface ActivityLogOptions {
	action: ActivityActionType;
	category: ActivityCategoryType;
	severity?: ActivitySeverityType;
	teamId?: string;
	userId?: string;
	details?: string;
	metadata?: Record<string, unknown>;
	resourceId?: string;
	resourceType?: string;
	expiresAt?: Date;
}
