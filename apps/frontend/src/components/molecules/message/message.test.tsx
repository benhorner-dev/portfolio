import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Message } from "./message";

beforeEach(() => {
	cleanup();
});

it("Message renders user message with right alignment", () => {
	const onQuickReply = vi.fn();
	render(
		<Message
			msgId="user-1"
			text="User message"
			isUser={true}
			onQuickReply={onQuickReply}
			isTyping={false}
		/>,
	);

	const message = screen.getByText("User message");
	expect(message).toBeInTheDocument();
});

it("Message renders bot message with left alignment and quick replies", () => {
	const onQuickReply = vi.fn();
	render(
		<Message
			msgId="bot-1"
			text="Bot message"
			isUser={false}
			quickReplies={["Yes", "No"]}
			onQuickReply={onQuickReply}
			isTyping={false}
		/>,
	);

	expect(screen.getByText("Bot message")).toBeInTheDocument();
	expect(screen.getByText("Yes")).toBeInTheDocument();
	expect(screen.getByText("No")).toBeInTheDocument();
});

it("Message handles quick reply click", () => {
	const onQuickReply = vi.fn();
	render(
		<Message
			msgId="bot-2"
			text="Bot message"
			isUser={false}
			quickReplies={["Yes"]}
			onQuickReply={onQuickReply}
			isTyping={false}
		/>,
	);

	const yesButton = screen.getByRole("button", { name: "Yes" });
	fireEvent.click(yesButton);
	expect(onQuickReply).toHaveBeenCalledWith("Yes");
});

it("Message shows typing state styling when isTyping is true", () => {
	const onQuickReply = vi.fn();
	render(
		<Message
			msgId="bot-3"
			text="Bot message"
			isUser={false}
			quickReplies={["Yes"]}
			onQuickReply={onQuickReply}
			isTyping={true}
		/>,
	);

	const quickReplyButton = screen.getByRole("button", { name: "Yes" });
	expect(quickReplyButton).toBeDisabled();
});
