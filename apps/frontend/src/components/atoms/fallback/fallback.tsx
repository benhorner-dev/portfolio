export function Fallback() {
	return (
		<div className="w-full max-w-2xl mx-auto px-6 py-8">
			<div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 shadow-2xl overflow-hidden">
				<div className="p-6">
					<div className="h-80 flex items-center justify-center">
						<div className="text-muted-foreground">Loading...</div>
					</div>
				</div>
			</div>
		</div>
	);
}
