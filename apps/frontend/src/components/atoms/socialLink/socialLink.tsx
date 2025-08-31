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
			className="transition-transform duration-300 hover:scale-110"
		>
			<Image
				src={imgGttr(src)}
				alt={alt}
				width={64}
				height={64}
				quality={85}
				className="w-16 h-16 object-contain"
				placeholder="blur"
			/>
		</Link>
	);
}
