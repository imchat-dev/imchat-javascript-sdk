"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiResponseSchema: () => ApiResponseSchema,
  AssistantAPI: () => AssistantAPI,
  AssistantSchema: () => AssistantSchema,
  ChatAPI: () => ChatAPI,
  ChatRequestSchema: () => ChatRequestSchema,
  ChatResponseSchema: () => ChatResponseSchema,
  CreateAssistantSchema: () => CreateAssistantSchema,
  CreateCredentialSchema: () => CreateCredentialSchema,
  CreateMessageSchema: () => CreateMessageSchema,
  CreateToolSchema: () => CreateToolSchema,
  CredentialAPI: () => CredentialAPI,
  CredentialSchema: () => CredentialSchema,
  DocumentAPI: () => DocumentAPI,
  DocumentIndexOptionsSchema: () => DocumentIndexOptionsSchema,
  DocumentSchema: () => DocumentSchema,
  DocumentUploadOptionsSchema: () => DocumentUploadOptionsSchema,
  ErrorSchema: () => ErrorSchema,
  IMChat: () => IMChat,
  MessageAPI: () => MessageAPI,
  MessageSchema: () => MessageSchema,
  ModelSchema: () => ModelSchema,
  PromptAPI: () => PromptAPI,
  PromptSchema: () => PromptSchema,
  PromptTypeSchema: () => PromptTypeSchema,
  ProviderAPI: () => ProviderAPI,
  ProviderSchema: () => ProviderSchema,
  SessionAPI: () => SessionAPI,
  SessionSchema: () => SessionSchema,
  ToolAPI: () => ToolAPI,
  ToolCallSchema: () => ToolCallSchema,
  ToolSchema: () => ToolSchema,
  ToolStatusSchema: () => ToolStatusSchema,
  ToolTransportSchema: () => ToolTransportSchema,
  UpdateAssistantSchema: () => UpdateAssistantSchema,
  UpdatePromptSchema: () => UpdatePromptSchema,
  UpdateToolSchema: () => UpdateToolSchema,
  imchat: () => imchat
});
module.exports = __toCommonJS(index_exports);

// src/api/assistant-api.ts
var import_zod12 = __toESM(require("zod"));

// src/lib/middleware.ts
var MiddlewarePipeline = class _MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
  }
  use(middleware) {
    if (this.middlewares.some((m) => m.name === middleware.name)) {
      return this;
    }
    this.middlewares.push(middleware);
    return this;
  }
  withMiddlewares(middlewares) {
    const newPipeline = new _MiddlewarePipeline();
    newPipeline.middlewares = [...this.middlewares];
    middlewares.forEach((middleware) => newPipeline.use(middleware));
    return newPipeline;
  }
  async execute(method, endpoint, input, client, handler) {
    const context = {
      method,
      endpoint,
      input,
      client
    };
    try {
      for (const middleware of this.middlewares) {
        if (middleware.before) {
          await middleware.before(context);
        }
      }
      const result = await handler();
      context.output = result;
      for (const middleware of this.middlewares) {
        if (middleware.after) {
          await middleware.after(context);
        }
      }
      return result;
    } catch (error) {
      context.error = error;
      for (const middleware of this.middlewares) {
        if (middleware.error) {
          await middleware.error(context);
        }
      }
      throw error;
    }
  }
};

// src/lib/base-client.ts
var BaseClient = class {
  constructor(baseUrl, clientApiKey, serverApiKey, timeout = 3e4) {
    this.baseUrl = baseUrl;
    this.clientApiKey = clientApiKey;
    this.serverApiKey = serverApiKey;
    this.timeout = timeout;
    this.middlewarePipeline = new MiddlewarePipeline();
  }
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "X-Client-Api-Key": this.clientApiKey,
          ...this.serverApiKey && { "X-Server-Api-Key": this.serverApiKey },
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });
      clearTimeout(timeoutId);
      const data = response.ok ? await response.json() : null;
      return {
        data,
        status: response.status,
        error: response.ok ? void 0 : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  // Middleware management
  use(middleware) {
    this.middlewarePipeline.use(middleware);
    return this;
  }
  // API call with middleware
  async apiCall(endpoint, input, options = {}, middlewares = []) {
    const pipeline = middlewares.length > 0 ? this.middlewarePipeline.withMiddlewares(middlewares) : this.middlewarePipeline;
    return pipeline.execute(
      options?.method || "GET",
      endpoint,
      input,
      this,
      async () => {
        return this.request(endpoint, options);
      }
    );
  }
  async uploadFile(endpoint, file, additionalData) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const formData = new FormData();
      formData.append("file", file);
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Client-Api-Key": this.clientApiKey,
          ...this.serverApiKey && { "X-Server-Api-Key": this.serverApiKey }
        },
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = response.ok ? await response.json() : null;
      return {
        data,
        status: response.status,
        error: response.ok ? void 0 : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : "Upload failed"
      };
    }
  }
  hasServerApiKey() {
    return !!this.serverApiKey;
  }
};

// src/schemas/common.ts
var import_zod = require("zod");
var ApiResponseSchema = import_zod.z.object({
  data: import_zod.z.any().optional(),
  error: import_zod.z.string().optional(),
  status: import_zod.z.number()
});
var ErrorSchema = import_zod.z.object({
  message: import_zod.z.string(),
  status: import_zod.z.number(),
  details: import_zod.z.any().optional()
});

// src/schemas/assistant.ts
var import_zod2 = require("zod");
var AssistantSchema = import_zod2.z.object({
  id: import_zod2.z.string(),
  name: import_zod2.z.string().min(1).max(255),
  description: import_zod2.z.string().max(1e3).optional(),
  provider: import_zod2.z.string().min(1).max(255),
  model: import_zod2.z.string().min(1).max(255),
  temperature: import_zod2.z.number().min(0).max(1).optional(),
  top_p: import_zod2.z.number().min(0).max(1).optional(),
  max_output_tokens: import_zod2.z.number().min(0).optional(),
  embedding_provider: import_zod2.z.string().min(1).max(255).optional(),
  embedding_model: import_zod2.z.string().min(1).max(255).optional(),
  embedding_dimension: import_zod2.z.number().min(0).optional(),
  retrieval_config: import_zod2.z.record(import_zod2.z.string(), import_zod2.z.any()).optional(),
  created_at: import_zod2.z.iso.datetime(),
  updated_at: import_zod2.z.iso.datetime().optional()
});
var CreateAssistantSchema = AssistantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});
var UpdateAssistantSchema = AssistantSchema.partial();

// src/schemas/document.ts
var import_zod3 = require("zod");
var DocumentSchema = import_zod3.z.object({
  id: import_zod3.z.string(),
  name: import_zod3.z.string().min(1).max(255),
  filepath: import_zod3.z.string().min(1),
  ext: import_zod3.z.string().min(1).max(10),
  file_size: import_zod3.z.number().min(0).optional(),
  created_at: import_zod3.z.iso.datetime(),
  indexed_at: import_zod3.z.iso.datetime().optional()
});
var DocumentUploadOptionsSchema = import_zod3.z.object({
  auto_index: import_zod3.z.boolean().optional(),
  chunk_size: import_zod3.z.number().min(1).max(1e4).optional(),
  chunk_overlap: import_zod3.z.number().min(0).max(1e3).optional()
});
var DocumentIndexOptionsSchema = import_zod3.z.object({
  chunk_size: import_zod3.z.number().min(1).max(1e4).optional(),
  chunk_overlap: import_zod3.z.number().min(0).max(1e3).optional()
});

// src/schemas/provider.ts
var import_zod4 = require("zod");
var ModelSchema = import_zod4.z.object({
  id: import_zod4.z.string(),
  name: import_zod4.z.string().min(1).max(255),
  max_tokens: import_zod4.z.number().min(1),
  supports_functions: import_zod4.z.boolean()
});
var ProviderSchema = import_zod4.z.object({
  id: import_zod4.z.string(),
  name: import_zod4.z.string().min(1).max(255),
  models: import_zod4.z.array(ModelSchema)
});

// src/schemas/credential.ts
var import_zod5 = require("zod");
var CredentialSchema = import_zod5.z.object({
  provider: import_zod5.z.string().min(1).max(255),
  api_key: import_zod5.z.string().min(1).optional(),
  metadata: import_zod5.z.record(import_zod5.z.string(), import_zod5.z.any()),
  created_at: import_zod5.z.iso.datetime(),
  updated_at: import_zod5.z.iso.datetime().optional()
});
var CreateCredentialSchema = import_zod5.z.object({
  provider: import_zod5.z.string().min(1).max(255),
  api_key: import_zod5.z.string().min(1),
  metadata: import_zod5.z.record(import_zod5.z.string(), import_zod5.z.any()).optional()
});

// src/schemas/session.ts
var import_zod6 = require("zod");
var SessionSchema = import_zod6.z.object({
  id: import_zod6.z.string(),
  assistant_id: import_zod6.z.string(),
  title: import_zod6.z.string().max(255).optional(),
  title_locked: import_zod6.z.boolean(),
  started_at: import_zod6.z.iso.datetime(),
  last_activity_at: import_zod6.z.iso.datetime(),
  client_ip: import_zod6.z.string().optional(),
  user_agent: import_zod6.z.string().optional(),
  updated_at: import_zod6.z.iso.datetime().optional()
});

// src/schemas/message.ts
var import_zod7 = require("zod");
var MessageSchema = import_zod7.z.object({
  id: import_zod7.z.string(),
  session_id: import_zod7.z.string(),
  assistant_id: import_zod7.z.string().optional(),
  message_role: import_zod7.z.string().min(1),
  content: import_zod7.z.string().min(1),
  model: import_zod7.z.string().optional(),
  provider: import_zod7.z.string().optional(),
  latency_ms: import_zod7.z.number().min(0).optional(),
  prompt_tokens: import_zod7.z.number().min(0).optional(),
  completion_tokens: import_zod7.z.number().min(0).optional(),
  total_tokens: import_zod7.z.number().min(0).optional(),
  created_at: import_zod7.z.iso.datetime(),
  updated_at: import_zod7.z.iso.datetime().optional()
});
var CreateMessageSchema = import_zod7.z.object({
  message_role: import_zod7.z.string().min(1),
  content: import_zod7.z.string().min(1),
  model: import_zod7.z.string().optional(),
  provider: import_zod7.z.string().optional()
});

// src/schemas/prompt.ts
var import_zod8 = require("zod");
var PromptTypeSchema = import_zod8.z.enum(["rag_system", "memory_summary", "title", "tool_instructions"]);
var PromptSchema = import_zod8.z.object({
  type: PromptTypeSchema,
  body: import_zod8.z.string().min(1),
  updated_at: import_zod8.z.iso.datetime()
});
var UpdatePromptSchema = import_zod8.z.object({
  type: PromptTypeSchema,
  body: import_zod8.z.string().min(1)
});

// src/schemas/tool.ts
var import_zod9 = require("zod");
var ToolTransportSchema = import_zod9.z.enum(["https", "mcp"]);
var ToolStatusSchema = import_zod9.z.enum(["active", "inactive"]);
var ToolSchema = import_zod9.z.object({
  id: import_zod9.z.string(),
  name: import_zod9.z.string().min(1).max(255),
  description: import_zod9.z.string().min(1).max(1e3),
  definition: import_zod9.z.record(import_zod9.z.string(), import_zod9.z.any()),
  transport: ToolTransportSchema,
  status: ToolStatusSchema,
  version: import_zod9.z.string().min(1),
  created_at: import_zod9.z.iso.datetime(),
  updated_at: import_zod9.z.iso.datetime().optional()
});
var CreateToolSchema = import_zod9.z.object({
  name: import_zod9.z.string().min(1).max(255),
  description: import_zod9.z.string().min(1).max(1e3),
  definition: import_zod9.z.record(import_zod9.z.string(), import_zod9.z.any()),
  transport: ToolTransportSchema
});
var UpdateToolSchema = ToolSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// src/schemas/chat.ts
var import_zod10 = require("zod");
var ChatRequestSchema = import_zod10.z.object({
  session_id: import_zod10.z.string().optional(),
  question: import_zod10.z.string().min(1),
  model_override: import_zod10.z.string().optional(),
  temperature_override: import_zod10.z.number().min(0).max(1).optional()
});
var ToolCallSchema = import_zod10.z.object({
  name: import_zod10.z.string(),
  arguments: import_zod10.z.record(import_zod10.z.string(), import_zod10.z.any()),
  result: import_zod10.z.any(),
  execution_time_ms: import_zod10.z.number().min(0)
});
var ChatResponseSchema = import_zod10.z.object({
  answer: import_zod10.z.string(),
  assistant_id: import_zod10.z.string(),
  session_id: import_zod10.z.string(),
  model: import_zod10.z.string(),
  provider: import_zod10.z.string(),
  message_id: import_zod10.z.string(),
  tool_calls: import_zod10.z.array(ToolCallSchema).optional(),
  metadata: import_zod10.z.object({
    tokens_used: import_zod10.z.number().min(0).optional()
  })
});

// src/middlewares/validation-middleware.ts
var import_zod11 = require("zod");

// src/lib/validation.ts
var ValidationError = class extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
    this.name = "ValidationError";
  }
};

// src/middlewares/validation-middleware.ts
var ValidationMiddleware = class {
  constructor(config) {
    this.config = config;
    this.name = "validation";
  }
  async before(context) {
    if (this.config.skipValidation || !this.config.inputSchema) {
      return;
    }
    try {
      const validatedInput = this.config.inputSchema.parse(context.input);
      context.input = validatedInput;
    } catch (error) {
      if (error instanceof import_zod11.z.ZodError) {
        throw new ValidationError("Input validation failed", error);
      }
      throw error;
    }
  }
  async after(context) {
    if (this.config.skipValidation || !this.config.outputSchema || !context.output) {
      return;
    }
    try {
      const validatedOutput = this.config.outputSchema.parse(context.output);
      context.output = validatedOutput;
    } catch (error) {
      if (error instanceof import_zod11.z.ZodError) {
        throw new ValidationError("Output validation failed", error);
      }
      throw error;
    }
  }
};

// src/middlewares/protected-middleware.ts
var ProtectedMiddleware = class {
  constructor() {
    this.name = "protected";
  }
  async before(context) {
    if (!context.client || !context.client.hasServerApiKey()) {
      let error = new Error("Access denied: server API key required for protected operation.");
      error.name = "ProtectedError";
      throw error;
    }
  }
};

// src/middlewares/error-middleware.ts
var ErrorHandlingMiddleware = class {
  constructor() {
    this.name = "error-handling";
  }
  async error(context) {
    if (context.error instanceof ValidationError) {
      const errorResponse = {
        status: 400,
        error: `Validation failed: ${context.error.message}`,
        data: void 0
      };
      context.output = errorResponse;
      context.error = void 0;
    }
  }
};

// src/api/assistant-api.ts
var AssistantAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async create(data) {
    const validation = new ValidationMiddleware({
      inputSchema: CreateAssistantSchema
    });
    return this.apiCall("/api/assistants", data, {
      method: "POST"
    }, [validation]);
  }
  async get(assistantId) {
    return this.apiCall(`/api/assistants/${assistantId}`);
  }
  async list() {
    return this.apiCall("/api/assistants");
  }
  async update(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod12.default.object({
        assistantId: import_zod12.default.string().min(1),
        data: UpdateAssistantSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}`, { assistantId, data }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod12.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}`, assistantId, {
      method: "DELETE"
    }, [validation]);
  }
  async reindex(assistantId, sources) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod12.default.object({
        sources: import_zod12.default.array(import_zod12.default.string()).min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/reindex`, { sources }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/document-api.ts
var import_zod13 = __toESM(require("zod"));
var DocumentAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod13.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs`, assistantId, {}, [validation]);
  }
  async get(assistantId, docId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod13.default.object({
        assistantId: import_zod13.default.string().min(1),
        docId: import_zod13.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {}, [validation]);
  }
  async upload(assistantId, file, options) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod13.default.object({
        assistantId: import_zod13.default.string().min(1),
        file: import_zod13.default.instanceof(File),
        options: DocumentUploadOptionsSchema.optional()
      })
    });
    const additionalData = {};
    if (options?.auto_index !== void 0) {
      additionalData.auto_index = options.auto_index.toString();
    }
    if (options?.chunk_size) {
      additionalData.chunk_size = options.chunk_size.toString();
    }
    if (options?.chunk_overlap) {
      additionalData.chunk_overlap = options.chunk_overlap.toString();
    }
    return this.uploadFile(
      `/api/assistants/${assistantId}/docs/upload`,
      file,
      additionalData
    );
  }
  async delete(assistantId, docId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod13.default.object({
        assistantId: import_zod13.default.string().min(1),
        docId: import_zod13.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {
      method: "DELETE"
    }, [validation]);
  }
  async index(assistantId, docId, options) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod13.default.object({
        assistantId: import_zod13.default.string().min(1),
        docId: import_zod13.default.string().min(1),
        options: DocumentIndexOptionsSchema.optional()
      })
    });
    const data = {
      chunk_size: options?.chunk_size || 1e3,
      chunk_overlap: options?.chunk_overlap || 50
    };
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}/index`, { assistantId, docId, options: data }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/provider-api.ts
var import_zod14 = __toESM(require("zod"));
var ProviderAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list() {
    return this.apiCall("/api/providers");
  }
  async get(providerId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod14.default.string().min(1)
    });
    return this.apiCall(`/api/providers/${providerId}`, providerId, {}, [validation]);
  }
};

// src/api/credential-api.ts
var import_zod15 = __toESM(require("zod"));
var CredentialAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod15.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/credentials`, assistantId, {}, [validation]);
  }
  async create(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod15.default.object({
        assistantId: import_zod15.default.string().min(1),
        data: CreateCredentialSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/credentials`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/session-api.ts
var import_zod16 = __toESM(require("zod"));
var SessionAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod16.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions`, assistantId, {}, [validation]);
  }
  async get(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod16.default.object({
        assistantId: import_zod16.default.string().min(1),
        sessionId: import_zod16.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {}, [validation]);
  }
  async create(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod16.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions`, assistantId, {
      method: "POST"
    }, [validation]);
  }
  async delete(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod16.default.object({
        assistantId: import_zod16.default.string().min(1),
        sessionId: import_zod16.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/message-api.ts
var import_zod17 = __toESM(require("zod"));
var MessageAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod17.default.object({
        assistantId: import_zod17.default.string().min(1),
        sessionId: import_zod17.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId }, {}, [validation]);
  }
  async create(assistantId, sessionId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod17.default.object({
        assistantId: import_zod17.default.string().min(1),
        sessionId: import_zod17.default.string().min(1),
        data: CreateMessageSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId, data }, {
      method: "POST"
    }, [validation]);
  }
  async delete(assistantId, sessionId, messageId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod17.default.object({
        assistantId: import_zod17.default.string().min(1),
        sessionId: import_zod17.default.string().min(1),
        messageId: import_zod17.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages/${messageId}`, { assistantId, sessionId, messageId }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/prompt-api.ts
var import_zod18 = __toESM(require("zod"));
var PromptAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async get(assistantId, promptType) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod18.default.object({
        assistantId: import_zod18.default.string().min(1),
        promptType: PromptTypeSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {}, [validation]);
  }
  async update(assistantId, promptType, body) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod18.default.object({
        assistantId: import_zod18.default.string().min(1),
        promptType: PromptTypeSchema,
        body: import_zod18.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType, body }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId, promptType) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod18.default.object({
        assistantId: import_zod18.default.string().min(1),
        promptType: PromptTypeSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/tool-api.ts
var import_zod19 = __toESM(require("zod"));
var ToolAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools`, assistantId, {}, [validation]);
  }
  async get(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        toolId: import_zod19.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {}, [validation]);
  }
  async create(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        data: CreateToolSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
  async update(assistantId, toolId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        toolId: import_zod19.default.string().min(1),
        data: UpdateToolSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId, data }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        toolId: import_zod19.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {
      method: "DELETE"
    }, [validation]);
  }
  async getVersions(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        toolId: import_zod19.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}/versions`, { assistantId, toolId }, {}, [validation]);
  }
  async rotateSecret(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod19.default.object({
        assistantId: import_zod19.default.string().min(1),
        toolId: import_zod19.default.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}/rotate-secret`, { assistantId, toolId }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/chat-api.ts
var import_zod20 = __toESM(require("zod"));
var ChatAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async send(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod20.default.object({
        assistantId: import_zod20.default.string().min(1),
        data: ChatRequestSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/chat`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
  // Legacy endpoint support
  async sendLegacy(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: import_zod20.default.object({
        assistantId: import_zod20.default.string().min(1),
        data: ChatRequestSchema
      })
    });
    return this.apiCall(`/chat/${assistantId}`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
};

// src/imchat.ts
var IMChat = class {
  constructor(config = {}) {
    const apiUrl = config.apiUrl || "https://test.dijidemi.com";
    const clientApiKey = config.clientApiKey || "";
    const serverApiKey = config.serverApiKey;
    const timeout = config.timeout || 3e4;
    this.assistants = new AssistantAPI(apiUrl, clientApiKey, serverApiKey);
    this.documents = new DocumentAPI(apiUrl, clientApiKey, serverApiKey);
    this.providers = new ProviderAPI(apiUrl, clientApiKey, serverApiKey);
    this.credentials = new CredentialAPI(apiUrl, clientApiKey, serverApiKey);
    this.sessions = new SessionAPI(apiUrl, clientApiKey, serverApiKey);
    this.messages = new MessageAPI(apiUrl, clientApiKey, serverApiKey);
    this.prompts = new PromptAPI(apiUrl, clientApiKey, serverApiKey);
    this.tools = new ToolAPI(apiUrl, clientApiKey, serverApiKey);
    this.chat = new ChatAPI(apiUrl, clientApiKey, serverApiKey);
  }
};
var imchat = new IMChat();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiResponseSchema,
  AssistantAPI,
  AssistantSchema,
  ChatAPI,
  ChatRequestSchema,
  ChatResponseSchema,
  CreateAssistantSchema,
  CreateCredentialSchema,
  CreateMessageSchema,
  CreateToolSchema,
  CredentialAPI,
  CredentialSchema,
  DocumentAPI,
  DocumentIndexOptionsSchema,
  DocumentSchema,
  DocumentUploadOptionsSchema,
  ErrorSchema,
  IMChat,
  MessageAPI,
  MessageSchema,
  ModelSchema,
  PromptAPI,
  PromptSchema,
  PromptTypeSchema,
  ProviderAPI,
  ProviderSchema,
  SessionAPI,
  SessionSchema,
  ToolAPI,
  ToolCallSchema,
  ToolSchema,
  ToolStatusSchema,
  ToolTransportSchema,
  UpdateAssistantSchema,
  UpdatePromptSchema,
  UpdateToolSchema,
  imchat
});
