import { ReservedMethod, TraceEvent } from "@/lib/explore/constants";
import type { Errors, MethodContext } from "@/lib/explore/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export function TracedClass(errors: Errors, verbose = false) {
	// biome-ignore lint/suspicious/noShadowRestrictedNames: false positive
	// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
	return <T extends { new (...args: any[]): any }>(constructor: T) => {
		return class TracedClass extends constructor {
			// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			constructor(...args: any[]) {
				super(...args);
				this.instrumentMethods();
			}

			private instrumentMethods(): void {
				const methods = this.getInstrumentableMethods();
				// biome-ignore lint/suspicious/useIterableCallbackReturn: TypeScript mixins require any[] for constructor parameters
				methods.forEach((methodName) => this.wrapMethod(methodName));
			}

			private getInstrumentableMethods(): string[] {
				const prototype = constructor.prototype;
				const allProperties = Object.getOwnPropertyNames(prototype);

				return allProperties.filter((name) =>
					this.isInstrumentableMethod(name, prototype),
				);
			}

			// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			private isInstrumentableMethod(name: string, prototype: any): boolean {
				if (this.isReservedMethodName(name)) {
					return false;
				}

				const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
				return descriptor?.value && typeof descriptor.value === "function";
			}

			private isReservedMethodName(name: string): boolean {
				const reservedNames = Object.values(ReservedMethod);
				return reservedNames.includes(name as ReservedMethod);
			}

			private wrapMethod(methodName: string): void {
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				const originalMethod = (this as any)[methodName].bind(this);
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				(this as any)[methodName] = (...args: any[]) => {
					return this.handleMethodCall(methodName, originalMethod, args);
				};
			}

			private handleMethodCall(
				methodName: string,
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				originalMethod: (...args: any[]) => any,
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				args: any[],
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			): any {
				const context = this.createTracedContext(methodName);

				this.logTrace(context, TraceEvent.ENTER, args);

				try {
					const result = originalMethod(...args);

					if (result instanceof Promise) {
						return this.handleAsyncResult(result, context);
					}

					return this.handleSyncResult(result, context);
				} catch (error) {
					return this.handleError(error, context);
				}
			}

			// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			private handleSyncResult(result: any, context: MethodContext): any {
				this.logTrace(context, TraceEvent.SUCCESS, result);
				return result;
			}

			private async handleAsyncResult(
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				promise: Promise<any>,
				context: MethodContext,
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			): Promise<any> {
				try {
					const result = await promise;
					this.logTrace(context, TraceEvent.SUCCESS, result);
					return result;
				} catch (error) {
					throw this.handleError(error, context);
				}
			}

			private handleError(error: unknown, context: MethodContext): never {
				if (error instanceof errors.parentError) {
					this.logTrace(context, TraceEvent.RE_RAISING);
					throw new errors.tracedError(
						`Error in ${context.methodName}: ${this.getErrorMessage(error)}`,
						this.getTraceId(),
						context.methodName,
						error as Error,
					);
				}

				this.logError(context, error);

				throw new errors.unExpectedError(
					`Error in ${context.methodName}: ${this.getErrorMessage(error)}`,
					this.getTraceId(),
					context.methodName,
					error as Error,
				);
			}

			private createTracedContext(methodName: string): MethodContext {
				return {
					className: constructor.name,
					methodName,
					traceId: this.getTraceId(),
				};
			}

			private logTrace(
				context: MethodContext,
				event: TraceEvent,
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				data?: any,
			): void {
				const message = `[${context.traceId}] ${context.className}.${context.methodName} - ${event}`;

				if (verbose && data !== undefined) {
					logger.trace(`${message}:`, data);
				} else {
					logger.trace(message);
				}
			}

			private logError(context: MethodContext, error: unknown): void {
				logger.error(
					`[${context.traceId}] ${context.className}.${context.methodName} - ${TraceEvent.ERROR}:`,
					error,
				);
			}

			private getErrorMessage(error: unknown): string {
				if (error instanceof Error) {
					return error.message;
				}
				return String(error);
			}

			private getTraceId(): string {
				// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
				return (this as any).traceId || "no-trace-id";
			}
		};
	};
}
