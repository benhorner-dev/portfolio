import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ImageSrc } from "@/lib/constants";
import { ImageSrcError } from "@/lib/errors";
import githubImage from "@/public/images/github.png";
import heroImage from "@/public/images/hero.png";
import linkedInImage from "@/public/images/linked-in.png";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getImageSrc = (src: string) => {
	switch (src) {
		case ImageSrc.HERO:
			return heroImage;
		case ImageSrc.LINKEDIN:
			return linkedInImage;
		case ImageSrc.GITHUB:
			return githubImage;
		default:
			throw new ImageSrcError(`Image source ${src} not found`);
	}
};
