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

	render(<Message message={mockMessage} onQuickReply={vi.fn()} />);

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

	render(<Message message={mockMessage} onQuickReply={vi.fn()} />);

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

	render(<Message message={mockMessage} onQuickReply={vi.fn()} />);

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

	render(<Message message={mockMessage} onQuickReply={vi.fn()} />);

	expect(screen.getByText("Bot message")).toBeInTheDocument();
});

it("Message renders with typing state", async () => {
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

	const { container } = render(
		<Message message={mockMessage} action={vi.fn()} />,
	);

	expect(screen.getByText("Typing message")).toBeInTheDocument();

	expect(screen.getByText("Reply 1")).toBeInTheDocument();
	expect(screen.getByText("Reply 2")).toBeInTheDocument();

	expect(container.innerHTML).toContain("bg-card/20");
	expect(container.innerHTML).toContain("text-muted-foreground");
});

it("Message calls onQuickReply when quick reply is clicked", async () => {
	const mockOnQuickReply = vi.fn();

	const { useChatInput } = await import("@/lib/hooks/useChatInput");
	vi.mocked(useChatInput).mockReturnValue({
		inputValue: "",
		isTyping: false,
		handleInputChange: vi.fn(),
		handleSend: vi.fn(() => true),
	});

	const { useChatStore } = await import("@/lib/stores/chatStore");
	vi.mocked(useChatStore).mockReturnValue({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => []),
	});

	const mockMessage = {
		id: "quick-reply-1",
		content: "Test message",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.AI,
		thoughts: [],
		quickReplies: ["Reply 1", "Reply 2"],
	};

	render(<Message message={mockMessage} onQuickReply={mockOnQuickReply} />);

	const replyButton = screen.getByText("Reply 1");
	replyButton.click();

	expect(mockOnQuickReply).toHaveBeenCalledWith("Reply 1");
});

it("Message renders thoughts when thoughts exist", async () => {
	const mockThoughts = ["thought1", "thought2"];

	const { useChatStore } = await import("@/lib/stores/chatStore");
	vi.mocked(useChatStore).mockReturnValue({
		quickReplies: [],
		setQuickReplies: vi.fn(),
		addMessages: vi.fn(),
		markMessageAsSent: vi.fn(),
		isMessageSent: vi.fn(() => false),
		getThoughts: vi.fn(() => mockThoughts),
	});

	const mockMessage = {
		id: "thoughts-1",
		content: "Message with thoughts",
		timestamp: new Date().toISOString(),
		type: InterlocutorType.AI,
		thoughts: [],
	};

	const { container } = render(
		<Message message={mockMessage} action={vi.fn()} />,
	);

	expect(
		container.querySelector('[data-slot="accordion"]'),
	).toBeInTheDocument();
	expect(container.innerHTML).toContain("🧠");
});
