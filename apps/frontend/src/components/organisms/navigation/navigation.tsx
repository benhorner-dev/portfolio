import type { ReactElement } from "react";
import type { LogoButton } from "@/components/atoms/logoButton";
import type { NavigationButton } from "@/components/atoms/navigationButton";

interface NavigationProps {
	logoButton: ReactElement<React.ComponentProps<typeof LogoButton>>;
	navigationButtons: ReactElement<
		React.ComponentProps<typeof NavigationButton>
	>[];
}

export function Navigation({ logoButton, navigationButtons }: NavigationProps) {
	return (
		<nav className="fixed top-4 left-4 right-4 z-50 bg-card/60 backdrop-blur-sm border border-border/20 rounded-xl">
			<div className="px-4">
				<div className="flex justify-between items-center h-12">
					<div className="flex-shrink-0">{logoButton}</div>

					<div className="flex-shrink-0 flex gap-3">{navigationButtons}</div>
				</div>
			</div>
		</nav>
	);
}
