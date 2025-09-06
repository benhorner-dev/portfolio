import { ReservedMethod, TraceEvent } from "@/lib/explore/constants";
import type { Errors, MethodContext } from "@/lib/explore/types";
import { getLogger } from "@/lib/logger";

const logger = getLogger();

export function TracedClass(errors: Errors, verbose = false) {
	// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
	return <T extends { new (...args: any[]): Record<string, unknown> }>(
		BaseConstructor: T,
	) => {
		return class TracedClass extends BaseConstructor {
			// biome-ignore lint/suspicious/noExplicitAny: TypeScript mixins require any[] for constructor parameters
			constructor(...args: any[]) {
				super(...args);
				this.instrumentMethods();
			}

			private instrumentMethods(): void {
				const methods = this.getInstrumentableMethods();
				for (const methodName of methods) {
					this.wrapMethod(methodName);
				}
			}

			private getInstrumentableMethods(): string[] {
				const prototype = BaseConstructor.prototype;
				const allProperties = Object.getOwnPropertyNames(prototype);

				return allProperties.filter((name) =>
					this.isInstrumentableMethod(name, prototype),
				);
			}

			private isInstrumentableMethod(
				name: string,
				prototype: Record<string, unknown>,
			): boolean {
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
				const originalMethod = (this as Record<string, unknown>)[
					methodName
				] as (...args: unknown[]) => unknown;
				(this as Record<string, unknown>)[methodName] = (
					...args: unknown[]
				) => {
					return this.handleMethodCall(
						methodName,
						originalMethod.bind(this),
						args,
					);
				};
			}

			private handleMethodCall(
				methodName: string,
				originalMethod: (...args: unknown[]) => unknown,
				args: unknown[],
			): unknown {
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

			private handleSyncResult(
				result: unknown,
				context: MethodContext,
			): unknown {
				this.logTrace(context, TraceEvent.SUCCESS, result);
				return result;
			}

			private async handleAsyncResult(
				promise: Promise<unknown>,
				context: MethodContext,
			): Promise<unknown> {
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
					className: BaseConstructor.name,
					methodName,
					traceId: this.getTraceId(),
				};
			}

			private logTrace(
				context: MethodContext,
				event: TraceEvent,
				data?: unknown,
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
				return (
					((this as Record<string, unknown>).traceId as string) || "no-trace-id"
				);
			}
		};
	};
}
