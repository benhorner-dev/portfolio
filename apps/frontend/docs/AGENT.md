# Agent System Documentation

## Overview

The Agent System is a sophisticated, flexible AI orchestration framework built on LangGraph that enables dynamic tool selection, parallel execution, and intelligent routing. It's designed to be highly configurable and extensible, allowing for easy addition of new tools, LLM providers, and answer formatters.

## Architecture

### Core Components

1. **AgentOrchestrator** - The main orchestrator class that manages the entire agent execution flow
2. **AgentGraphFactory** - Factory for creating the LangGraph execution graph
3. **Tools** - Executable functions that perform specific tasks
4. **LLM Providers** - Language model integrations (OpenAI, Mock, etc.)
5. **Answer Formatters** - Functions that format final responses
6. **State Management** - Handles agent state, tool results, and execution steps

### Key Features

- **Flexible Configuration**: Pass in configs that set initial tools, normal tools, LLM providers, and answer formatters
- **Parallel Tool Execution**: Tools can run in parallel when multiple tools are selected
- **Deterministic Triggers**: Automatic tool selection based on specific patterns in responses
- **State Binding**: Tools can access agent state through configurable bindings
- **Tracing & Logging**: Comprehensive tracing and error handling with the `@TracedClass` decorator
- **Streaming Support**: Real-time streaming of agent responses and intermediate steps

## Configuration

### AgentConfig Schema

The agent accepts a configuration object that defines its behavior:

```typescript
interface AgentConfig {
  langsmithUrl: string;
  systemPrompt: string;
  defaultAgentActionLog: string;
  llms: LLMConfig[];
  tools: ToolConfig[];
  initialTools: ToolConfig[];
  maxIntermediateSteps: number;
  answerFormatters: AnswerFormatterConfig[];
  defaultErrorMessage: string;
  embeddingModelName: string;
  vectorResultsTopK: number;
  indexName: string;
}
```

### Configuration Loading

Configurations are loaded from JSON files using the `getAgentConfig` function:

```typescript
const config = await getAgentConfig(process.env.AGENT_CONFIG_PATH);
```

## Tool System

### Tool Interface

All tools implement the `Tool` interface:

```typescript
interface Tool<T = unknown> {
  name: string;
  description: string;
  invoke(input: T): Promise<string | ToolMessage>;
}
```

### Built-in Tools

1. **final_answer** - Formats and returns the final response to the user
2. **rag_graph_search** - Performs hybrid vector + graph search on portfolio data
3. **mock_rag_graph_search** - Mock version for testing

### Tool State Binding

Tools can access agent state through the `ToolStateBinding` system:

```typescript
const TOOL_STATE_BINDINGS = {
  rag_graph_search: {
    stateFields: [
      ToolBindingKeys.TOP_K,
      ToolBindingKeys.EMBEDDING_MODEL_NAME,
      ToolBindingKeys.INDEX_NAME,
      ToolBindingKeys.CHAT_ID,
    ],
  },
};
```

### Creating Custom Tools

1. **Define the Tool Schema**:

```typescript
const MyToolSchema = z.object({
  query: z.string().describe("The search query"),
  // ... other fields
});
```

2. **Create the Tool Function**:

```typescript
export const myTool = tool(
  async (props) => myToolFunction(props as MyToolArgs),
  {
    name: "my_tool",
    description: "Description of what the tool does",
    schema: MyToolSchema,
  }
);
```

3. **Add to Tool Map**:

```typescript
const CUSTOM_TOOL_MAP = {
  ...DEFAULT_TOOL_MAP,
  my_tool: myTool,
};
```

4. **Register in Configuration**:

```json
{
  "tools": [
    {
      "name": "my_tool",
      "description": "Description of what the tool does"
    }
  ]
}
```

## LLM Providers

### Built-in Providers

1. **OpenAI** - Production OpenAI integration
2. **Mock** - Testing and development LLM

### Adding Custom LLM Providers

1. **Create the Provider Function**:

```typescript
export const getCustomLLM = (config: CustomLLMConfig) => {
  // Return a BaseChatModel instance
  return new CustomChatModel(config);
};
```

2. **Add to LLM Map**:

```typescript
const CUSTOM_LLM_MAP = {
  ...DEFAULT_LLM_MAP,
  custom: getCustomLLM,
};
```

3. **Use in Configuration**:

```json
{
  "llms": [
    {
      "provider": "custom",
      "providerArgs": {
        "model": "custom-model",
        "temperature": 0.7
      }
    }
  ]
}
```

## Answer Formatters

### Built-in Formatters

1. **default** - Standard response formatting
2. **thoughtless** - Simplified formatting without thinking steps

### Creating Custom Answer Formatters

1. **Define the Formatter Function**:

```typescript
export const customAnswerFormatter = (result: FinalAnswerArgs): string => {
  // Custom formatting logic
  return formattedResult;
};
```

2. **Add to Formatter Map**:

```typescript
const CUSTOM_FORMATTER_MAP = {
  ...DEFAULT_FORMATTER_MAP,
  custom: customAnswerFormatter,
};
```

3. **Use in Configuration**:

```json
{
  "answerFormatters": [
    {
      "name": "custom"
    }
  ]
}
```

## Execution Flow

### 1. Initialization

- Load configuration from JSON file
- Initialize tool maps, LLM providers, and answer formatters
- Create the LangGraph execution graph

### 2. Oracle Phase

- Analyze available tools based on current state
- Apply deterministic triggers if conditions are met
- Use LLM to select appropriate tools
- Create execution steps for selected tools

### 3. Tool Execution

- Execute selected tools (parallel or sequential)
- Bind agent state to tool inputs
- Collect and store tool results
- Update agent state with new information

### 4. Routing

- Determine next action based on tool results
- Route back to Oracle or to Final Answer
- Handle maximum step limits and error conditions

### 5. Final Answer

- Format the final response using the configured formatter
- Extract course links and other metadata
- Return structured response

## Deterministic Triggers

The system supports deterministic tool selection based on specific patterns:

```typescript
enum DeterministicAgentTrigger {
  ABORT = "__ABORT__",
  RAG_GRAPH_SEARCH = "__RAG_GRAPH_SEARCH__",
}
```

When these patterns are detected in tool results, the system automatically selects the corresponding tool without LLM intervention.

## State Management

### AgentState

The agent maintains state throughout execution:

```typescript
interface AgentState {
  input: string;
  chatHistory: string;
  intermediateSteps: ExecutionStep[];
  chatId: string;
  topK: number;
  indexName: string;
  embeddingModelName: string;
  usedTools: Set<ToolName>;
  toolResults: Partial<Record<ToolName, string>>;
}
```

### Execution Steps

Each tool execution creates an `ExecutionStep`:

```typescript
interface ExecutionStep {
  actions: AgentAction[];
  results: string[];
  executionType: ExecutionType;
  timestamp?: number;
}
```

## Error Handling

### Error Hierarchy

1. **AgentGraphError** - Base error class for expected, recoverable errors
2. **TracedAgentGraphError** - Errors with tracing context (extends AgentGraphError)
3. **UnexpectedAgentGraphError** - Unexpected errors that should bubble up

### Error Handling Strategy

The system follows a **fail-fast** approach:

- **Expected Errors**: Catch and handle within tools using `AgentGraphError` and its subclasses
- **Unexpected Errors**: Let them bubble up to the top layer (agent function) for proper handling
- **Tool Errors**: Should only catch and wrap expected errors, allowing unexpected errors to propagate

### Custom Error Classes

Create specific error types by extending `AgentGraphError`:

```typescript
export class ToolExecutionError extends AgentGraphError {
  constructor(
    message: string,
    public toolName: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

export class ConfigurationError extends AgentGraphError {
  constructor(message: string, public configPath: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
```

### Tool Error Handling Pattern

```typescript
export const myTool = tool(
  async (props) => {
    try {
      // Tool logic that might fail
      const result = await performOperation(props);
      return result;
    } catch (error) {
      // Only catch expected errors
      if (error instanceof ExpectedError) {
        throw new ToolExecutionError(
          `Tool ${TOOL_NAME} failed: ${error.message}`,
          TOOL_NAME,
          error
        );
      }
      // Let unexpected errors bubble up
      throw error;
    }
  },
  {
    name: TOOL_NAME,
    description: "Description of what the tool does",
    schema: MyToolSchema,
  }
);
```

### Top-Level Error Handling

The agent function handles all errors at the top level:

```typescript
export const agent = async (message, config, chatHistory, chatId, ...) => {
  try {
    // Agent execution logic
    const response = await orchestrator.execute(message, chatId, formattedLastFourChats);
    return response;
  } catch (error) {
    // All errors are handled here - both expected and unexpected
    logger.error("Error in agent", error);
    return {
      answer: "",
      graphMermaid: "",
      error: error as Error,
      courseLinks: [],
      totalTokens: 0,
    };
  }
};
```

### Tracing

The `@TracedClass` decorator provides comprehensive tracing:

- Method entry/exit logging
- Error tracking with context
- Performance monitoring
- Debug information
- Automatic error wrapping for traced classes

## Usage Examples

### Basic Usage

```typescript
import { agent } from "@/lib/explore/agent/agent";

const response = await agent(
  "Tell me about your React projects",
  config,
  chatHistory,
  chatId
);
```

### Custom Configuration

```typescript
const customConfig = {
  ...defaultConfig,
  tools: [
    { name: "rag_graph_search", description: "Search portfolio" },
    { name: "my_custom_tool", description: "Custom functionality" },
  ],
  initialTools: [
    { name: "rag_graph_search", description: "Always start with search" },
  ],
  maxIntermediateSteps: 5,
};
```

### Injecting Custom Maps

```typescript
const customMaps = {
  toolMap: {
    ...DEFAULT_TOOL_MAP,
    my_tool: myCustomTool,
  },
  llmMap: {
    ...DEFAULT_LLM_MAP,
    custom: getCustomLLM,
  },
  formatterMap: {
    ...DEFAULT_FORMATTER_MAP,
    custom: customFormatter,
  },
};

const response = await agent(message, config, chatHistory, chatId, customMaps);
```

## Testing

### Unit Tests

The system includes comprehensive unit tests for:

- Agent orchestration
- Tool execution
- Graph building
- Error handling
- State management

### Mock Tools

Use `mock_rag_graph_search` for testing without external dependencies:

```typescript
const testConfig = {
  ...config,
  tools: [{ name: "mock_rag_graph_search", description: "Mock search" }],
};
```

## Performance Considerations

### Parallel Execution

Tools are executed in parallel when multiple tools are selected, improving performance.

### Caching

- Agent configurations are cached using Next.js `unstable_cache`
- Chat history is cached for performance
- Tool results are stored in agent state

### Token Management

The system tracks token usage across all LLM calls and provides total token counts in responses.

## Best Practices

1. **Tool Design**: Keep tools focused and single-purpose
2. **Error Handling**:
   - Only catch and wrap **expected** errors within tools using `AgentGraphError` subclasses
   - Let **unexpected** errors bubble up to the top layer for proper handling
   - Create specific error types by extending `AgentGraphError` for different failure scenarios
3. **State Binding**: Only bind necessary state fields to tools
4. **Configuration**: Use meaningful descriptions for tools and formatters
5. **Testing**: Always test with mock tools before using real integrations
6. **Logging**: Use the tracing system for debugging and monitoring
7. **Fail-Fast**: Don't suppress unexpected errors - let them fail fast and be handled at the appropriate abstraction level

## Troubleshooting

### Common Issues

1. **Tool Not Found**: Ensure the tool is registered in the tool map
2. **State Binding Errors**: Check that bound state fields exist in AgentState
3. **LLM Errors**: Verify LLM configuration and API keys
4. **Graph Compilation**: Check that all required tools and formatters are available

### Debug Mode

Enable verbose logging by setting `VERBOSE_LOGGING` to `true` in the environment.

## Extension Points

The system is designed for easy extension:

1. **New Tools**: Add to tool map and configuration
2. **New LLM Providers**: Implement provider function and add to LLM map
3. **New Answer Formatters**: Create formatter function and add to formatter map
4. **Custom Triggers**: Add new deterministic triggers and corresponding tools
5. **State Extensions**: Add new fields to AgentState and update bindings

This architecture provides a robust, flexible foundation for building sophisticated AI agents that can be easily customized and extended for different use cases.
