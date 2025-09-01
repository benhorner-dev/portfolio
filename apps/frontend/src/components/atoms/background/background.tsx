export function Background() {
	return (
		<div className="absolute inset-0 -z-10">
			<div className="absolute inset-0 bg-unix-cyber" />
			<div className="absolute inset-0 opacity-5 bg-matrix-grid" />
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-ctp-teal opacity-10 blur-3xl rounded-full" />
			<div className="absolute bottom-0 right-1/4 w-80 h-80 bg-ctp-sapphire opacity-15 blur-3xl rounded-full" />
			<div className="absolute top-1/3 right-1/5 w-64 h-64 bg-ctp-green opacity-8 blur-2xl rounded-full" />
		</div>
	);
}
