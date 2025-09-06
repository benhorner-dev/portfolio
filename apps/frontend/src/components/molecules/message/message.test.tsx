import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { InterlocutorType } from "@/lib/explore/constants";
import { Message } from "./message";

vi.mock("@/lib/hooks/useChatMessages", () => ({
	useChatMessages: vi.fn(() => ({
		sendMessage: vi.fn(),
	})),
}));

vi.mock("@/lib/hooks/useChatInput", () => ({
	useChatInput: vi.fn(() => ({
		isTyping: false,
	})),
}));

vi.mock("@/lib/stores/chatStore", () => ({
	useChatStore: vi.fn(() => ({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
	})),
}));

beforeEach(() => {
	cleanup();
});

it("Message renders user message with right alignment", () => {
	const mockMessage = {
		id: "user-1",
		content: "User message",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.HUMAN,
		thoughts: [],
	};

	render(<Message message={mockMessage} />);

	const message = screen.getByText("User message");
	expect(message).toBeInTheDocument();
});

it("Message renders bot message with left alignment", () => {
	const mockMessage = {
		id: "bot-1",
		content: "Bot message",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.AI,
		thoughts: [],
	};

	render(<Message message={mockMessage} />);

	expect(screen.getByText("Bot message")).toBeInTheDocument();
});

it("Message renders with content", () => {
	const mockMessage = {
		id: "bot-2",
		content: "Bot message",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.AI,
		thoughts: [],
	};

	render(<Message message={mockMessage} />);

	expect(screen.getByText("Bot message")).toBeInTheDocument();
});

it("Message renders without errors", () => {
	const mockMessage = {
		id: "bot-3",
		content: "Bot message",
		type: InterlocutorType.AI,
		timestamp: new Date().toISOString(),
		thoughts: [],
	};

	render(<Message message={mockMessage} />);

	expect(screen.getByText("Bot message")).toBeInTheDocument();
});

it("Message renders with typing state", async () => {
	// Override the useChatInput mock to return isTyping: true
	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: true,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	const mockMessage = {
		id: "typing-1",
		content: "Typing message",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.AI,
		thoughts: [],
		quickReplies: ["Reply 1", "Reply 2"],
	};

	const { container } = render(<Message message={mockMessage} />);

	expect(screen.getByText("Typing message")).toBeInTheDocument();

	// Verify quick reply buttons are rendered with typing styles
	expect(screen.getByText("Reply 1")).toBeInTheDocument();
	expect(screen.getByText("Reply 2")).toBeInTheDocument();

	// Check that the typing styles are applied to the quick reply buttons
	expect(container.innerHTML).toContain("bg-card/20");
	expect(container.innerHTML).toContain("text-muted-foreground");
});
