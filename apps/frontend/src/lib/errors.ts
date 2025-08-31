export class ContentConfigError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);
		this.name = "ContentConfigError";
		this.cause = cause;
	}
}

export class ContentConfigLoadError extends ContentConfigError {
	constructor(message: string, cause?: Error) {
		super(message, cause);
		this.name = "ContentConfigLoadError";
	}
}

export class ContentConfigParseError extends ContentConfigError {
	constructor(message: string, cause?: Error) {
		super(message, cause);
		this.name = "ContentConfigParseError";
	}
}

export class ImageSrcError extends ContentConfigError {
	constructor(message: string) {
		super(message);
		this.name = "ImageSrcError";
	}
}
