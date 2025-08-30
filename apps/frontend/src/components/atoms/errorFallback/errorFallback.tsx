"use client";

import { Button } from "@/components/atoms/button";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { Environment } from "@/lib/constants";

interface ErrorFallbackProps {
	error: unknown;
	componentStack: string;
	eventId: string;
	resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
	return (
		<div className="w-full max-w-2xl mx-auto px-6 py-8">
			<div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden">
				<div className="p-6 text-center">
					<div className="h-80 flex flex-col items-center justify-center space-y-4">
						<TypographyH2 text="Chat Unavailable" />
						<TypographyP text="We're experiencing technical difficulties with the chat feature. Please try again later." />

						<Button onClick={resetError} variant="outline">
							Try Again
						</Button>

						{process.env.NODE_ENV === Environment.DEVELOPMENT && (
							<details className="mt-4 text-left">
								<summary className="cursor-pointer text-sm text-muted-foreground">
									Error Details (Development)
								</summary>
								<pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
									{error instanceof Error ? error.message : String(error)}
								</pre>
							</details>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
