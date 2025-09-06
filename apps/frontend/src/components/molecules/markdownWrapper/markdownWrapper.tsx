import ReactMarkdown from "react-markdown";

export const MarkdownWrapper = ({ text }: { text: string }) => (
	<ReactMarkdown
		components={{
			h2: ({ children }) => (
				<h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900">
					{children}
				</h2>
			),
			p: ({ children }) => (
				<p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
			),
			ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
			li: ({ children }) => <li className="mb-1">{children}</li>,
			hr: () => <hr className="my-3 border-gray-300" />,
			em: ({ children }) => (
				<em className="text-gray-600 text-sm">{children}</em>
			),
		}}
	>
		{text}
	</ReactMarkdown>
);
