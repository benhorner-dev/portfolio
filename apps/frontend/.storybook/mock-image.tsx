const MockNextImage = ({
	src,
	alt,
	width,
	height,
	quality,
	priority,
	fill,
	sizes,
	className,
	placeholder,
	...props
}: {
	src: string | { src: string };
	alt?: string;
	width?: number;
	height?: number;
	quality?: number;
	priority?: boolean;
	fill?: boolean;
	sizes?: string;
	className?: string;
	placeholder?: string;
	[key: string]: unknown;
}) => {
	const imageProps = {
		src: typeof src === "object" && src?.src ? src.src : (src as string),
		alt,
		width: fill ? undefined : width,
		height: fill ? undefined : height,
		className,
		...props,
	};

	if (fill) {
		return (
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundImage: `url(${imageProps.src})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
				{...props}
			/>
		);
	}

	return <img {...imageProps} alt={alt || ""} />;
};

export default MockNextImage;
