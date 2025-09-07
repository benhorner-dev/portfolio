/* v8 ignore start */
import Link from "next/link";
/* v8 ignore stop */
import { Background } from "@/components/atoms/background/background";
import { TypographyH1 } from "@/components/atoms/h1/h1";
import { TypographyP } from "@/components/atoms/p/p";

export default function NotFound() {
	return (
		<>
			<Background />
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="text-center space-y-8 max-w-2xl mx-auto">
					<div className="terminal-frame p-8 space-y-6">
						<div className="space-y-4">
							<div className="animate-error-shake">
								<TypographyH1 text="404" />
							</div>
							<div className="terminal-prompt text-left">
								<span className="text-ctp-red">error:</span> page not found
							</div>
						</div>

						<div className="space-y-4 text-left">
							<TypographyP text="The requested resource could not be found on this server." />

							<div className="bg-ctp-surface0 p-4 rounded border border-ctp-surface2">
								<div className="text-ctp-subtext0 text-sm font-mono">
									<div className="flex items-center gap-2 mb-2">
										<span className="text-ctp-green">❯</span>
										<span>Possible causes:</span>
									</div>
									<ul className="list-disc list-inside space-y-1 ml-4">
										<li>URL was typed incorrectly</li>
										<li>Page has been moved or deleted</li>
										<li>Link is broken or outdated</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="/"
								className="px-6 py-3 bg-ctp-mauve text-ctp-base rounded font-mono font-semibold hover:bg-ctp-pink transition-all duration-300 hover:shadow-lg hover:shadow-ctp-mauve/25 animate-terminal-glow"
							>
								← Return Home
							</Link>
						</div>

						<div className="text-ctp-subtext0 text-sm font-mono">
							<div className="flex items-center justify-center gap-2">
								<span className="text-ctp-green">❯</span>
								<span>Status: 404 Not Found</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
