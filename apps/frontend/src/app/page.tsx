import { chatEvalFlag } from "@/flags";

export default async function Home() {
	const flag = await chatEvalFlag();
	return <div>{flag ? "Hello World" : "Goodbye World"}</div>;
}
