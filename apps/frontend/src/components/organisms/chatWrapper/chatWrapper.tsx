import { FeatureFlag } from "@/app/constants";
import { TypographyH2 } from "@/components/atoms/h2";
import { TypographyP } from "@/components/atoms/p";
import { ChatHeader } from "@/components/molecules/chatHeader";
import { LoginButton } from "@/components/molecules/loginBtn";
import { LoginOverlay } from "@/components/molecules/loginOverlay";
import { ChatClientWrapper } from "@/components/organisms/chatWrapper";
import { DisabledChat } from "@/components/organisms/disabledChat";
import { createFeatureFlag } from "@/flags";
import { getAgentConfig } from "@/lib/explore/getAgentConfig";
import { getContentConfig } from "@/lib/getContentConfig";
import { getAuth0UserId } from "@/lib/identity/auth0";

export async function ChatWrapper() {
	const auth0UserId = await getAuth0UserId();
	const isChatEnabled = await createFeatureFlag(FeatureFlag.CHAT, () =>
		Promise.resolve(auth0UserId),
	)();
	const contentConfig = await getContentConfig();
	const agentConfigPath = process.env.AGENT_CONFIG_PATH;
	const agentConfig = await getAgentConfig(agentConfigPath);
	const chatHeader = (
		<ChatHeader
			title={<TypographyH2 text={contentConfig.chat.header.title} />}
			subtitle={<TypographyP text={contentConfig.chat.header.subtitle} />}
		/>
	);
	if (isChatEnabled) {
		return (
			<ChatClientWrapper
				chatId={auth0UserId}
				header={chatHeader}
				placeholderTexts={contentConfig.chat.input.placeholder}
				config={agentConfig}
			/>
		);
	}

	const loginTitle = (
		<TypographyH2 text={contentConfig.chat.loginOverlay.title} />
	);
	const loginDescription = (
		<TypographyP text={contentConfig.chat.loginOverlay.description} />
	);
	const loginButton = (
		<LoginButton text={contentConfig.chat.loginOverlay.loginButton.text} />
	);
	const loginOverlay = (
		<LoginOverlay
			title={loginTitle}
			description={loginDescription}
			loginButton={loginButton}
		/>
	);

	return (
		<DisabledChat
			header={chatHeader}
			placeholderTexts={contentConfig.chat.input.placeholder}
			overlay={loginOverlay}
		/>
	);
}
