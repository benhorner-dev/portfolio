import type { ScreenType } from "@/app/constants";

interface ScreenProps {
	children: React.ReactNode;
	screenType: ScreenType;
	screenId?: string;
}

export function Screen({ children, screenType, screenId }: ScreenProps) {
	return (
		<div
			id={screenId}
			className="h-screen flex items-center justify-center snap-start"
			data-screen={screenType}
		>
			{children}
		</div>
	);
}
