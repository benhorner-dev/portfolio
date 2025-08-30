import Image from "next/image";

/* v8 ignore start */
import Link from "next/link";

/* v8 ignore stop */

interface SocialLinkProps {
	href: string;
	alt: string;
	src: string;
}

export function SocialLink({ href, alt, src }: SocialLinkProps) {
	return (
		<Link
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="transition-transform duration-300 hover:scale-110"
		>
			<Image
				src={src}
				alt={alt}
				width={64}
				height={64}
				className="w-16 h-16 object-contain"
			/>
		</Link>
	);
}
