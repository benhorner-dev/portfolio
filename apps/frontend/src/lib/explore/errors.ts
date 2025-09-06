export class AgentGraphError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AgentGraphError";
	}
}

export class TracedAgentGraphError extends AgentGraphError {
	constructor(
		message: string,
		public traceId?: string,
		public step?: string,
		public originalError?: Error,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class UnexpectedAgentGraphError extends AgentGraphError {
	constructor(
		message: string,
		public traceId?: string,
		public step?: string,
		public originalError?: Error,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}
