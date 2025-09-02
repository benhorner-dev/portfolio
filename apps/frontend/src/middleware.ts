import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./lib/identity/auth0";

const EXISTING_API_ROUTES = [
	"/api/feature-flag-webhook",
	"/api/sentry-webhook",
];

function isExistingApiRoute(pathname: string): boolean {
	return EXISTING_API_ROUTES.some((route) => pathname.startsWith(route));
}

function applySecurityHeaders(response: NextResponse): NextResponse {
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Strict-Transport-Security",
		"max-age=31536000; includeSubDomains",
	);
	return response;
}

export async function middleware(request: NextRequest) {
	if (request.headers.get("x-middleware-subrequest")) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	if (isExistingApiRoute(request.nextUrl.pathname)) {
		const response = NextResponse.next();
		return applySecurityHeaders(response);
	}

	const auth0Response = await auth0.middleware(
		request as unknown as Parameters<typeof auth0.middleware>[0],
	);

	if (auth0Response) {
		return auth0Response;
	}

	const response = NextResponse.next();
	return applySecurityHeaders(response);
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
	],
};
