import Image, { type StaticImageData } from "next/image";

interface BackgroundImageProps {
	src: StaticImageData;
	alt: string;
	priority?: boolean;
}

export function BackgroundImage({
	src,
	alt,
	priority = true,
}: BackgroundImageProps) {
	return (
		<div className="absolute inset-0 -z-10">
			<Image
				src={src}
				alt={alt}
				fill
				className="object-cover"
				priority={priority}
				sizes="100vw"
				quality={85}
				placeholder="blur"
			/>

			<div className="absolute inset-0 bg-primary/40" aria-hidden="true" />
		</div>
	);
}
