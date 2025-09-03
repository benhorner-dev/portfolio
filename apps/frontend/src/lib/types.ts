import type { z } from "zod";
import type { SessionSchema } from "@/lib/schema";

export type TypographyProps = {
	text: string;
};

export type Session = z.infer<typeof SessionSchema>;
export type SessionUser = Session["user"];
