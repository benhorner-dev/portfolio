interface NavigationButtonProps {
	href: string;
	text: string;
}

export function NavigationButton({ href, text }: NavigationButtonProps) {
	return (
		<a
			href={href}
			className="px-4 py-1.5 text-foreground border border-foreground rounded-md hover:bg-foreground/10 hover:border-foreground/60 hover:text-foreground hover:shadow-lg hover:shadow-foreground/20 transition-all duration-300 cursor-pointer inline-block text-center"
		>
			{text}
		</a>
	);
}
