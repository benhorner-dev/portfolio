import { useCallback } from "react";
import { useChatStore } from "@/lib/stores/chatStore";

export const useChatInput = () => {
	const { inputValue, setInputValue, clearInput, isTyping } = useChatStore();

	const handleInputChange = useCallback(
		(value: string) => {
			setInputValue(value);
		},
		[setInputValue],
	);

	const handleSend = useCallback(() => {
		if (!inputValue.trim() || isTyping) return false;

		clearInput();
		return true;
	}, [inputValue, isTyping, clearInput]);

	return {
		inputValue,
		isTyping,
		handleInputChange,
		handleSend,
	};
};
