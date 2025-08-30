import { z } from "zod";
import { LogLevel } from "@/lib/logger";

const SentryUserSchema = z.object({
	id: z.string(),
	email: z.email().optional(),
	ip_address: z.string().optional(),
});

const SentryEventSchema = z.object({
	event_id: z.string(),
	project: z.number(),
	message: z.string(),
	title: z.string().optional(),
	level: z.enum(LogLevel),
	culprit: z.string().optional(),
	datetime: z.string(),
	url: z.url().optional(),
	web_url: z.url().optional(),
	issue_url: z.url().optional(),
	issue_id: z.string().optional(),
	tags: z.array(z.tuple([z.string(), z.string()])).optional(),
	user: SentryUserSchema.optional(),
});

const SentryDataSchema = z.object({
	id: z.string(),
	project: z.union([z.string(), z.object({ name: z.string() })]).optional(),
	culprit: z.string().optional(),
	title: z.string().optional(),
	message: z.string().optional(),
	permalink: z.url().optional(),
	web_url: z.url().optional(),
	level: z.enum(LogLevel).optional(),
	firstSeen: z.string().optional(),
	lastSeen: z.string().optional(),
	tags: z.record(z.string(), z.string()).optional(),
});

export const SentryWebhookPayloadSchema = z.object({
	action: z.string(),
	data: z.object({
		issue: SentryDataSchema.optional(),
		error: SentryDataSchema.optional(),
		event: SentryEventSchema.optional(),
		triggered_rule: z.string().optional(),
	}),
});

const SlackBlockElementSchema = z.object({
	type: z.string(),
	text: z.object({
		type: z.string(),
		text: z.string(),
		emoji: z.boolean().optional(),
	}),
	url: z.url(),
	style: z.string().optional(),
});

const SlackBlockSchema = z.object({
	type: z.string(),
	text: z
		.object({
			type: z.string(),
			text: z.string(),
			emoji: z.boolean().optional(),
		})
		.optional(),
	fields: z
		.array(
			z.object({
				type: z.string(),
				text: z.string(),
			}),
		)
		.optional(),
	elements: z.array(SlackBlockElementSchema).optional(),
});

export const SlackMessageSchema = z.object({
	text: z.string().optional(),
	blocks: z.array(SlackBlockSchema).optional(),
	username: z.string().optional(),
	icon_emoji: z.string().optional(),
});

export const SentryAlertSchema = z.object({
	id: z.string(),
	project: z.string(),
	culprit: z.string().optional(),
	message: z.string(),
	url: z.url().optional(),
	level: z.enum(LogLevel),
	event: z.object({
		event_id: z.string(),
		timestamp: z.string(),
		environment: z.string().optional(),
		tags: z.record(z.string(), z.string()).optional(),
		user: z
			.object({
				email: z.email().optional(),
				id: z.string().optional(),
			})
			.optional(),
	}),
});
