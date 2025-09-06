import { tool } from "@langchain/core/tools";

import { RagGraphSearchSchema } from "@/lib/explore/schema";

const TOOL_NAME = "mock_rag_graph_search";

/* v8 ignore start */
export const mockRagGraphSearchTool = tool(
	async (_) => "mock rag graph search",
	{
		name: TOOL_NAME,
		description: "mock rag graph search",
		schema: RagGraphSearchSchema,
	},
);
/* v8 ignore stop */
