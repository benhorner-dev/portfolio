"use client";

/* v8 ignore start */
import Link from "next/link";
/* v8 ignore stop */
import { Background } from "@/components/atoms/background/background";
import { TypographyH1 } from "@/components/atoms/h1/h1";
import { TypographyP } from "@/components/atoms/p/p";

export default function ErrorPage() {
	return (
		<>
			<Background />
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="text-center space-y-8 max-w-2xl mx-auto">
					<div className="terminal-frame p-8 space-y-6">
						<div className="space-y-4">
							<div className="animate-error-shake">
								<TypographyH1 text="500" />
							</div>
							<div className="terminal-prompt text-left animate-terminal-flicker">
								<span className="text-ctp-red">error:</span> internal server
								error
							</div>
						</div>

						<div className="space-y-4 text-left">
							<TypographyP text="Something went wrong on our end. We're working to fix this issue." />

							<div className="bg-ctp-surface0 p-4 rounded border border-ctp-surface2">
								<div className="text-ctp-subtext0 text-sm font-mono">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-ctp-blue">ℹ</span>
										<span>Troubleshooting steps:</span>
									</div>
									<ul className="list-disc list-inside space-y-1 ml-4">
										<li>Try refreshing the page</li>
										<li>Clear your browser cache</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="/"
								className="px-6 py-3 bg-ctp-mauve text-ctp-base rounded font-mono font-semibold hover:bg-ctp-pink transition-all duration-300 hover:shadow-lg hover:shadow-ctp-mauve/25 animate-terminal-glow"
							>
								🏠 Go Home
							</Link>
						</div>

						<div className="text-ctp-subtext0 text-sm font-mono">
							<div className="flex items-center justify-center gap-2">
								<span className="text-ctp-red">❯</span>
								<span>Status: 500 Internal Server Error</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
