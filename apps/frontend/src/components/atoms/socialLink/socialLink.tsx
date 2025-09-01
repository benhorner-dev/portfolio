import Image, { type StaticImageData } from "next/image";
/* v8 ignore start */
import Link from "next/link";
import { getImageSrc } from "@/lib/utils";

/* v8 ignore stop */

interface SocialLinkProps {
	href: string;
	alt: string;
	src: string;
	imgGttr?: (src: string) => StaticImageData;
}

export function SocialLink({
	href,
	alt,
	src,
	imgGttr = getImageSrc,
}: SocialLinkProps) {
	return (
		<Link
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="transition-all duration-300 hover:scale-110 group p-2 rounded-lg bg-ctp-surface1/30 hover:bg-ctp-surface1/50 border border-ctp-surface2/30 hover:border-ctp-blue/50"
		>
			<Image
				src={imgGttr(src)}
				alt={alt}
				width={64}
				height={64}
				quality={85}
				className="w-16 h-16 object-contain transition-all duration-300 [filter:brightness(0)_saturate(100%)_invert(100%)_sepia(100%)_saturate(2000%)_hue-rotate(200deg)_brightness(1.1)]"
				placeholder="blur"
			/>
		</Link>
	);
}
