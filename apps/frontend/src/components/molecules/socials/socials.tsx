import type { SocialLink } from "@/components/atoms/socialLink";

interface SocialsProps {
	links: React.ReactElement<React.ComponentProps<typeof SocialLink>>[];
}

export function Socials({ links }: SocialsProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
			{links}
		</div>
	);
}
