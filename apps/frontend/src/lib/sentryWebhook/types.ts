import type { z } from "zod";
import type {
	SentryAlertSchema,
	SentryWebhookPayloadSchema,
	SlackMessageSchema,
} from "./schema";

export type SentryWebhookPayload = z.infer<typeof SentryWebhookPayloadSchema>;

export type SlackMessage = z.infer<typeof SlackMessageSchema>;

export type SentryAlert = z.infer<typeof SentryAlertSchema>;
