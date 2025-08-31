import { z } from "zod";

export const SlackHeadersSchema = z.object({
	"x-slack-request-timestamp": z.string(),
	"x-slack-signature": z.string(),
});

export const UrlVerificationSchema = z.object({
	type: z.literal("url_verification"),
	challenge: z.string(),
});

export const SlackEventSchema = z.object({
	type: z.literal("event_callback"),
	event: z.object({
		type: z.literal("message"),
		text: z.string(),
		subtype: z.literal("bot_message"),
		bot_id: z.string(),
		channel: z.string(),
		ts: z.string(),
	}),
});

export const SlackRequestSchema = z.discriminatedUnion("type", [
	UrlVerificationSchema,
	SlackEventSchema,
]);

export const EnvSchema = z.object({
	SLACK_SIGNING_SECRET: z.string().min(1),
});
