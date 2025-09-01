export function Background() {
	return (
		<div className="absolute inset-0 -z-10">
			<div className="absolute inset-0 bg-unix-cyber" />
			<div className="absolute inset-0 opacity-5 bg-matrix-grid" />
			<div className="absolute top-0 left-1/4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-96 lg:h-96 bg-ctp-teal opacity-10 blur-3xl rounded-full" />
			<div className="absolute bottom-0 right-1/4 w-24 h-24 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-80 lg:h-80 bg-ctp-sapphire opacity-15 blur-3xl rounded-full" />
			<div className="absolute top-1/3 right-1/5 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-ctp-green opacity-8 blur-2xl rounded-full" />
		</div>
	);
}
