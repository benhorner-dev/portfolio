export class DomainError extends Error {
	status: number;
	constructor(message: string, status = 500) {
		super(message);
		this.name = new.target.name;
		this.status = status;
	}
}

export class ConfigurationError extends DomainError {
	constructor(message: string) {
		super(message, 500);
	}
}

export class AuthenticationError extends DomainError {
	constructor(message: string) {
		super(message, 401);
	}
}

export class SlackApiError extends DomainError {
	constructor(message: string, status = 502) {
		super(message, status);
	}
}
