class FeatureFlagWebhookError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FeatureFlagWebhookError";
	}
}

export class FeatureFlagWebhookAuthenticationError extends FeatureFlagWebhookError {}

export class FeatureFlagWebhookValidationError extends FeatureFlagWebhookError {}
