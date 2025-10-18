import z$1, { z } from 'zod';

/**
 * Common schemas for the sdk
 */

/**
 * Api response schema
 */
declare const ApiResponseSchema: z.ZodObject<{
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    status: z.ZodNumber;
}, z.core.$strip>;
declare const ErrorSchema: z.ZodObject<{
    message: z.ZodString;
    status: z.ZodNumber;
    details: z.ZodOptional<z.ZodAny>;
}, z.core.$strip>;

declare const AssistantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    provider: z.ZodString;
    model: z.ZodString;
    temperature: z.ZodOptional<z.ZodNumber>;
    top_p: z.ZodOptional<z.ZodNumber>;
    max_output_tokens: z.ZodOptional<z.ZodNumber>;
    embedding_provider: z.ZodOptional<z.ZodString>;
    embedding_model: z.ZodOptional<z.ZodString>;
    embedding_dimension: z.ZodOptional<z.ZodNumber>;
    retrieval_config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
declare const CreateAssistantSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    provider: z.ZodString;
    model: z.ZodString;
    temperature: z.ZodOptional<z.ZodNumber>;
    top_p: z.ZodOptional<z.ZodNumber>;
    max_output_tokens: z.ZodOptional<z.ZodNumber>;
    embedding_provider: z.ZodOptional<z.ZodString>;
    embedding_model: z.ZodOptional<z.ZodString>;
    embedding_dimension: z.ZodOptional<z.ZodNumber>;
    retrieval_config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
declare const UpdateAssistantSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    provider: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    top_p: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    max_output_tokens: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    embedding_provider: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    embedding_model: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    embedding_dimension: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    retrieval_config: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    created_at: z.ZodOptional<z.ZodISODateTime>;
    updated_at: z.ZodOptional<z.ZodOptional<z.ZodISODateTime>>;
}, z.core.$strip>;

declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    filepath: z.ZodString;
    ext: z.ZodString;
    file_size: z.ZodOptional<z.ZodNumber>;
    created_at: z.ZodISODateTime;
    indexed_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
declare const DocumentUploadOptionsSchema: z.ZodObject<{
    auto_index: z.ZodOptional<z.ZodBoolean>;
    chunk_size: z.ZodOptional<z.ZodNumber>;
    chunk_overlap: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
declare const DocumentIndexOptionsSchema: z.ZodObject<{
    chunk_size: z.ZodOptional<z.ZodNumber>;
    chunk_overlap: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;

declare const ModelSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    max_tokens: z.ZodNumber;
    supports_functions: z.ZodBoolean;
}, z.core.$strip>;
declare const ProviderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    models: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        max_tokens: z.ZodNumber;
        supports_functions: z.ZodBoolean;
    }, z.core.$strip>>;
}, z.core.$strip>;

declare const CredentialSchema: z.ZodObject<{
    provider: z.ZodString;
    api_key: z.ZodOptional<z.ZodString>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
declare const CreateCredentialSchema: z.ZodObject<{
    provider: z.ZodString;
    api_key: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;

declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    assistant_id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    title_locked: z.ZodBoolean;
    started_at: z.ZodISODateTime;
    last_activity_at: z.ZodISODateTime;
    client_ip: z.ZodOptional<z.ZodString>;
    user_agent: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;

declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    session_id: z.ZodString;
    assistant_id: z.ZodOptional<z.ZodString>;
    message_role: z.ZodString;
    content: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    latency_ms: z.ZodOptional<z.ZodNumber>;
    prompt_tokens: z.ZodOptional<z.ZodNumber>;
    completion_tokens: z.ZodOptional<z.ZodNumber>;
    total_tokens: z.ZodOptional<z.ZodNumber>;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
declare const CreateMessageSchema: z.ZodObject<{
    message_role: z.ZodString;
    content: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;

declare const PromptTypeSchema: z.ZodEnum<{
    title: "title";
    rag_system: "rag_system";
    memory_summary: "memory_summary";
    tool_instructions: "tool_instructions";
}>;
declare const PromptSchema: z.ZodObject<{
    type: z.ZodEnum<{
        title: "title";
        rag_system: "rag_system";
        memory_summary: "memory_summary";
        tool_instructions: "tool_instructions";
    }>;
    body: z.ZodString;
    updated_at: z.ZodISODateTime;
}, z.core.$strip>;
declare const UpdatePromptSchema: z.ZodObject<{
    type: z.ZodEnum<{
        title: "title";
        rag_system: "rag_system";
        memory_summary: "memory_summary";
        tool_instructions: "tool_instructions";
    }>;
    body: z.ZodString;
}, z.core.$strip>;

declare const ToolTransportSchema: z.ZodEnum<{
    https: "https";
    mcp: "mcp";
}>;
declare const ToolStatusSchema: z.ZodEnum<{
    active: "active";
    inactive: "inactive";
}>;
declare const ToolSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    definition: z.ZodRecord<z.ZodString, z.ZodAny>;
    transport: z.ZodEnum<{
        https: "https";
        mcp: "mcp";
    }>;
    status: z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>;
    version: z.ZodString;
    created_at: z.ZodISODateTime;
    updated_at: z.ZodOptional<z.ZodISODateTime>;
}, z.core.$strip>;
declare const CreateToolSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    definition: z.ZodRecord<z.ZodString, z.ZodAny>;
    transport: z.ZodEnum<{
        https: "https";
        mcp: "mcp";
    }>;
}, z.core.$strip>;
declare const UpdateToolSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
    }>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    transport: z.ZodOptional<z.ZodEnum<{
        https: "https";
        mcp: "mcp";
    }>>;
    definition: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;

declare const ChatRequestSchema: z.ZodObject<{
    session_id: z.ZodOptional<z.ZodString>;
    question: z.ZodString;
    model_override: z.ZodOptional<z.ZodString>;
    temperature_override: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
declare const ToolCallSchema: z.ZodObject<{
    name: z.ZodString;
    arguments: z.ZodRecord<z.ZodString, z.ZodAny>;
    result: z.ZodAny;
    execution_time_ms: z.ZodNumber;
}, z.core.$strip>;
declare const ChatResponseSchema: z.ZodObject<{
    answer: z.ZodString;
    assistant_id: z.ZodString;
    session_id: z.ZodString;
    model: z.ZodString;
    provider: z.ZodString;
    message_id: z.ZodString;
    tool_calls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        arguments: z.ZodRecord<z.ZodString, z.ZodAny>;
        result: z.ZodAny;
        execution_time_ms: z.ZodNumber;
    }, z.core.$strip>>>;
    metadata: z.ZodObject<{
        tokens_used: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;

type ApiResponse<T = any> = {
    data?: T;
    error?: string;
    status: number;
};
type ApiError = z$1.infer<typeof ErrorSchema>;

type Assistant = z$1.infer<typeof AssistantSchema>;

type Document = z$1.infer<typeof DocumentSchema>;

type Provider = z$1.infer<typeof ProviderSchema>;

type Credential = z$1.infer<typeof CredentialSchema>;

type Session = z$1.infer<typeof SessionSchema>;

type Message = z$1.infer<typeof MessageSchema>;

type Prompt = z$1.infer<typeof PromptSchema>;

type Tool = z$1.infer<typeof ToolSchema>;

type ChatRequest = z$1.infer<typeof ChatRequestSchema>;
type ChatResponse = z$1.infer<typeof ChatResponseSchema>;

/**
 * ImChat Middleware context
 */
interface MiddlewareContext<T = any> {
    client: BaseClient;
    method: string;
    endpoint: string;
    input?: unknown;
    output?: T;
    error?: Error;
    metadata?: Record<string, any>;
}
interface Middleware<T = any> {
    name: string;
    before?: (context: MiddlewareContext<T>) => Promise<void> | void;
    after?: (context: MiddlewareContext<T>) => Promise<void> | void;
    error?: (context: MiddlewareContext<T>) => Promise<void> | void;
}
declare class MiddlewarePipeline<T = any> {
    private middlewares;
    use(middleware: Middleware<T>): this;
    withMiddlewares(middlewares: Middleware<T>[]): MiddlewarePipeline<T>;
    execute(method: string, endpoint: string, input: unknown, client: BaseClient, handler: () => Promise<T>): Promise<T>;
}

/**
 * Base client for all clients for the sdk
 */

declare abstract class BaseClient {
    /**
     * The base url of the api
    */
    protected baseUrl: string;
    /**
     * The client api key - used to publicly access the client api
     */
    protected clientApiKey: string;
    /**
     * The server api key - used to access the server api (optional)
     */
    protected serverApiKey?: string;
    protected timeout: number;
    /**
     * The middleware pipeline for the client
     */
    protected middlewarePipeline: MiddlewarePipeline;
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string, timeout?: number);
    protected request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;
    use(middleware: Middleware): this;
    protected apiCall<T>(endpoint: string, input?: unknown, options?: RequestInit, middlewares?: Middleware[]): Promise<ApiResponse<T>>;
    protected uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<ApiResponse<T>>;
    hasServerApiKey(): boolean;
}

declare class AssistantAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    create(data: z$1.infer<typeof CreateAssistantSchema>): Promise<ApiResponse<Assistant>>;
    get(assistantId: string): Promise<ApiResponse<Assistant>>;
    list(): Promise<ApiResponse<Assistant[]>>;
    update(assistantId: string, data: z$1.infer<typeof UpdateAssistantSchema>): Promise<ApiResponse<Assistant>>;
    delete(assistantId: string): Promise<ApiResponse<void>>;
    reindex(assistantId: string, sources: string[]): Promise<ApiResponse<void>>;
}

declare class DocumentAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(assistantId: string): Promise<ApiResponse<Document[]>>;
    get(assistantId: string, docId: string): Promise<ApiResponse<Document>>;
    upload(assistantId: string, file: File, options?: z$1.infer<typeof DocumentUploadOptionsSchema>): Promise<ApiResponse<Document>>;
    delete(assistantId: string, docId: string): Promise<ApiResponse<void>>;
    index(assistantId: string, docId: string, options?: z$1.infer<typeof DocumentIndexOptionsSchema>): Promise<ApiResponse<{
        document_id: string;
        chunks_created: number;
        indexed_at: string;
        status: string;
    }>>;
}

declare class ProviderAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(): Promise<ApiResponse<{
        providers: Provider[];
    }>>;
    get(providerId: string): Promise<ApiResponse<Provider>>;
}

declare class CredentialAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(assistantId: string): Promise<ApiResponse<Credential[]>>;
    create(assistantId: string, data: z$1.infer<typeof CreateCredentialSchema>): Promise<ApiResponse<Credential>>;
}

declare class SessionAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(assistantId: string): Promise<ApiResponse<Session[]>>;
    get(assistantId: string, sessionId: string): Promise<ApiResponse<Session>>;
    create(assistantId: string): Promise<ApiResponse<Session>>;
    delete(assistantId: string, sessionId: string): Promise<ApiResponse<void>>;
}

declare class MessageAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(assistantId: string, sessionId: string): Promise<ApiResponse<Message[]>>;
    create(assistantId: string, sessionId: string, data: z$1.infer<typeof CreateMessageSchema>): Promise<ApiResponse<Message>>;
    delete(assistantId: string, sessionId: string, messageId: string): Promise<ApiResponse<void>>;
}

declare class PromptAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    get(assistantId: string, promptType: z$1.infer<typeof PromptTypeSchema>): Promise<ApiResponse<Prompt>>;
    update(assistantId: string, promptType: z$1.infer<typeof PromptTypeSchema>, body: string): Promise<ApiResponse<Prompt>>;
    delete(assistantId: string, promptType: z$1.infer<typeof PromptTypeSchema>): Promise<ApiResponse<void>>;
}

declare class ToolAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    list(assistantId: string): Promise<ApiResponse<Tool[]>>;
    get(assistantId: string, toolId: string): Promise<ApiResponse<Tool>>;
    create(assistantId: string, data: z$1.infer<typeof CreateToolSchema>): Promise<ApiResponse<Tool>>;
    update(assistantId: string, toolId: string, data: z$1.infer<typeof UpdateToolSchema>): Promise<ApiResponse<Tool>>;
    delete(assistantId: string, toolId: string): Promise<ApiResponse<void>>;
    getVersions(assistantId: string, toolId: string): Promise<ApiResponse<Tool[]>>;
    rotateSecret(assistantId: string, toolId: string): Promise<ApiResponse<{
        new_secret: string;
        expires_at: string;
    }>>;
}

declare class ChatAPI extends BaseClient {
    constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string);
    send(assistantId: string, data: z$1.infer<typeof ChatRequestSchema>): Promise<ApiResponse<ChatResponse>>;
    sendLegacy(assistantId: string, data: z$1.infer<typeof ChatRequestSchema>): Promise<ApiResponse<ChatResponse>>;
}

interface IMChatConfig {
    apiUrl?: string;
    clientApiKey?: string;
    serverApiKey?: string;
    timeout?: number;
}
declare class IMChat {
    assistants: AssistantAPI;
    documents: DocumentAPI;
    providers: ProviderAPI;
    credentials: CredentialAPI;
    sessions: SessionAPI;
    messages: MessageAPI;
    prompts: PromptAPI;
    tools: ToolAPI;
    chat: ChatAPI;
    constructor(config?: IMChatConfig);
}
declare const imchat: IMChat;

export { type ApiError, type ApiResponse, ApiResponseSchema, type Assistant, AssistantAPI, AssistantSchema, ChatAPI, type ChatRequest, ChatRequestSchema, type ChatResponse, ChatResponseSchema, CreateAssistantSchema, CreateCredentialSchema, CreateMessageSchema, CreateToolSchema, type Credential, CredentialAPI, CredentialSchema, type Document, DocumentAPI, DocumentIndexOptionsSchema, DocumentSchema, DocumentUploadOptionsSchema, ErrorSchema, IMChat, type IMChatConfig, type Message, MessageAPI, MessageSchema, ModelSchema, type Prompt, PromptAPI, PromptSchema, PromptTypeSchema, type Provider, ProviderAPI, ProviderSchema, type Session, SessionAPI, SessionSchema, type Tool, ToolAPI, ToolCallSchema, ToolSchema, ToolStatusSchema, ToolTransportSchema, UpdateAssistantSchema, UpdatePromptSchema, UpdateToolSchema, imchat };
