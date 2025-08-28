export class DbError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DbError";
	}
}

export class DbOpError extends DbError {
	constructor(message: string) {
		super(message);
		this.name = "DbOpError";
	}
}

export class DbClientError extends DbError {
	constructor(message: string) {
		super(message);
		this.name = "DbClientError";
	}
}

export class DbQueryError extends DbError {
	constructor(message: string) {
		super(message);
		this.name = "DbQueryError";
	}
}
