import React, { type ReactNode } from "react";

const MockNextLink = ({
	href,
	children,
	...props
}: {
	href: string;
	children: ReactNode;
	[key: string]: unknown;
}) => {
	return React.createElement("a", { href, ...props }, children);
};

export default MockNextLink;
