// src/api/assistant-api.ts
import z12 from "zod";

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
import { z } from "zod";
var ApiResponseSchema = z.object({
  data: z.any().optional(),
  error: z.string().optional(),
  status: z.number()
});
var ErrorSchema = z.object({
  message: z.string(),
  status: z.number(),
  details: z.any().optional()
});

// src/schemas/assistant.ts
import { z as z2 } from "zod";
var AssistantSchema = z2.object({
  id: z2.string(),
  name: z2.string().min(1).max(255),
  description: z2.string().max(1e3).optional(),
  provider: z2.string().min(1).max(255),
  model: z2.string().min(1).max(255),
  temperature: z2.number().min(0).max(1).optional(),
  top_p: z2.number().min(0).max(1).optional(),
  max_output_tokens: z2.number().min(0).optional(),
  embedding_provider: z2.string().min(1).max(255).optional(),
  embedding_model: z2.string().min(1).max(255).optional(),
  embedding_dimension: z2.number().min(0).optional(),
  retrieval_config: z2.record(z2.string(), z2.any()).optional(),
  created_at: z2.iso.datetime(),
  updated_at: z2.iso.datetime().optional()
});
var CreateAssistantSchema = AssistantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});
var UpdateAssistantSchema = AssistantSchema.partial();

// src/schemas/document.ts
import { z as z3 } from "zod";
var DocumentSchema = z3.object({
  id: z3.string(),
  name: z3.string().min(1).max(255),
  filepath: z3.string().min(1),
  ext: z3.string().min(1).max(10),
  file_size: z3.number().min(0).optional(),
  created_at: z3.iso.datetime(),
  indexed_at: z3.iso.datetime().optional()
});
var DocumentUploadOptionsSchema = z3.object({
  auto_index: z3.boolean().optional(),
  chunk_size: z3.number().min(1).max(1e4).optional(),
  chunk_overlap: z3.number().min(0).max(1e3).optional()
});
var DocumentIndexOptionsSchema = z3.object({
  chunk_size: z3.number().min(1).max(1e4).optional(),
  chunk_overlap: z3.number().min(0).max(1e3).optional()
});

// src/schemas/provider.ts
import { z as z4 } from "zod";
var ModelSchema = z4.object({
  id: z4.string(),
  name: z4.string().min(1).max(255),
  max_tokens: z4.number().min(1),
  supports_functions: z4.boolean()
});
var ProviderSchema = z4.object({
  id: z4.string(),
  name: z4.string().min(1).max(255),
  models: z4.array(ModelSchema)
});

// src/schemas/credential.ts
import { z as z5 } from "zod";
var CredentialSchema = z5.object({
  provider: z5.string().min(1).max(255),
  api_key: z5.string().min(1).optional(),
  metadata: z5.record(z5.string(), z5.any()),
  created_at: z5.iso.datetime(),
  updated_at: z5.iso.datetime().optional()
});
var CreateCredentialSchema = z5.object({
  provider: z5.string().min(1).max(255),
  api_key: z5.string().min(1),
  metadata: z5.record(z5.string(), z5.any()).optional()
});

// src/schemas/session.ts
import { z as z6 } from "zod";
var SessionSchema = z6.object({
  id: z6.string(),
  assistant_id: z6.string(),
  title: z6.string().max(255).optional(),
  title_locked: z6.boolean(),
  started_at: z6.iso.datetime(),
  last_activity_at: z6.iso.datetime(),
  client_ip: z6.string().optional(),
  user_agent: z6.string().optional(),
  updated_at: z6.iso.datetime().optional()
});

// src/schemas/message.ts
import { z as z7 } from "zod";
var MessageSchema = z7.object({
  id: z7.string(),
  session_id: z7.string(),
  assistant_id: z7.string().optional(),
  message_role: z7.string().min(1),
  content: z7.string().min(1),
  model: z7.string().optional(),
  provider: z7.string().optional(),
  latency_ms: z7.number().min(0).optional(),
  prompt_tokens: z7.number().min(0).optional(),
  completion_tokens: z7.number().min(0).optional(),
  total_tokens: z7.number().min(0).optional(),
  created_at: z7.iso.datetime(),
  updated_at: z7.iso.datetime().optional()
});
var CreateMessageSchema = z7.object({
  message_role: z7.string().min(1),
  content: z7.string().min(1),
  model: z7.string().optional(),
  provider: z7.string().optional()
});

// src/schemas/prompt.ts
import { z as z8 } from "zod";
var PromptTypeSchema = z8.enum(["rag_system", "memory_summary", "title", "tool_instructions"]);
var PromptSchema = z8.object({
  type: PromptTypeSchema,
  body: z8.string().min(1),
  updated_at: z8.iso.datetime()
});
var UpdatePromptSchema = z8.object({
  type: PromptTypeSchema,
  body: z8.string().min(1)
});

// src/schemas/tool.ts
import { z as z9 } from "zod";
var ToolTransportSchema = z9.enum(["https", "mcp"]);
var ToolStatusSchema = z9.enum(["active", "inactive"]);
var ToolSchema = z9.object({
  id: z9.string(),
  name: z9.string().min(1).max(255),
  description: z9.string().min(1).max(1e3),
  definition: z9.record(z9.string(), z9.any()),
  transport: ToolTransportSchema,
  status: ToolStatusSchema,
  version: z9.string().min(1),
  created_at: z9.iso.datetime(),
  updated_at: z9.iso.datetime().optional()
});
var CreateToolSchema = z9.object({
  name: z9.string().min(1).max(255),
  description: z9.string().min(1).max(1e3),
  definition: z9.record(z9.string(), z9.any()),
  transport: ToolTransportSchema
});
var UpdateToolSchema = ToolSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// src/schemas/chat.ts
import { z as z10 } from "zod";
var ChatRequestSchema = z10.object({
  session_id: z10.string().optional(),
  question: z10.string().min(1),
  model_override: z10.string().optional(),
  temperature_override: z10.number().min(0).max(1).optional()
});
var ToolCallSchema = z10.object({
  name: z10.string(),
  arguments: z10.record(z10.string(), z10.any()),
  result: z10.any(),
  execution_time_ms: z10.number().min(0)
});
var ChatResponseSchema = z10.object({
  answer: z10.string(),
  assistant_id: z10.string(),
  session_id: z10.string(),
  model: z10.string(),
  provider: z10.string(),
  message_id: z10.string(),
  tool_calls: z10.array(ToolCallSchema).optional(),
  metadata: z10.object({
    tokens_used: z10.number().min(0).optional()
  })
});

// src/middlewares/validation-middleware.ts
import { z as z11 } from "zod";

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
      if (error instanceof z11.ZodError) {
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
      if (error instanceof z11.ZodError) {
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
      inputSchema: z12.object({
        assistantId: z12.string().min(1),
        data: UpdateAssistantSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}`, { assistantId, data }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z12.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}`, assistantId, {
      method: "DELETE"
    }, [validation]);
  }
  async reindex(assistantId, sources) {
    const validation = new ValidationMiddleware({
      inputSchema: z12.object({
        sources: z12.array(z12.string()).min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/reindex`, { sources }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/document-api.ts
import z13 from "zod";
var DocumentAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z13.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs`, assistantId, {}, [validation]);
  }
  async get(assistantId, docId) {
    const validation = new ValidationMiddleware({
      inputSchema: z13.object({
        assistantId: z13.string().min(1),
        docId: z13.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {}, [validation]);
  }
  async upload(assistantId, file, options) {
    const validation = new ValidationMiddleware({
      inputSchema: z13.object({
        assistantId: z13.string().min(1),
        file: z13.instanceof(File),
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
      inputSchema: z13.object({
        assistantId: z13.string().min(1),
        docId: z13.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {
      method: "DELETE"
    }, [validation]);
  }
  async index(assistantId, docId, options) {
    const validation = new ValidationMiddleware({
      inputSchema: z13.object({
        assistantId: z13.string().min(1),
        docId: z13.string().min(1),
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
import z14 from "zod";
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
      inputSchema: z14.string().min(1)
    });
    return this.apiCall(`/api/providers/${providerId}`, providerId, {}, [validation]);
  }
};

// src/api/credential-api.ts
import z15 from "zod";
var CredentialAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z15.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/credentials`, assistantId, {}, [validation]);
  }
  async create(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: z15.object({
        assistantId: z15.string().min(1),
        data: CreateCredentialSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/credentials`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/session-api.ts
import z16 from "zod";
var SessionAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z16.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions`, assistantId, {}, [validation]);
  }
  async get(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: z16.object({
        assistantId: z16.string().min(1),
        sessionId: z16.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {}, [validation]);
  }
  async create(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z16.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions`, assistantId, {
      method: "POST"
    }, [validation]);
  }
  async delete(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: z16.object({
        assistantId: z16.string().min(1),
        sessionId: z16.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/message-api.ts
import z17 from "zod";
var MessageAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId, sessionId) {
    const validation = new ValidationMiddleware({
      inputSchema: z17.object({
        assistantId: z17.string().min(1),
        sessionId: z17.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId }, {}, [validation]);
  }
  async create(assistantId, sessionId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: z17.object({
        assistantId: z17.string().min(1),
        sessionId: z17.string().min(1),
        data: CreateMessageSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId, data }, {
      method: "POST"
    }, [validation]);
  }
  async delete(assistantId, sessionId, messageId) {
    const validation = new ValidationMiddleware({
      inputSchema: z17.object({
        assistantId: z17.string().min(1),
        sessionId: z17.string().min(1),
        messageId: z17.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/sessions/${sessionId}/messages/${messageId}`, { assistantId, sessionId, messageId }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/prompt-api.ts
import z18 from "zod";
var PromptAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async get(assistantId, promptType) {
    const validation = new ValidationMiddleware({
      inputSchema: z18.object({
        assistantId: z18.string().min(1),
        promptType: PromptTypeSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {}, [validation]);
  }
  async update(assistantId, promptType, body) {
    const validation = new ValidationMiddleware({
      inputSchema: z18.object({
        assistantId: z18.string().min(1),
        promptType: PromptTypeSchema,
        body: z18.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType, body }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId, promptType) {
    const validation = new ValidationMiddleware({
      inputSchema: z18.object({
        assistantId: z18.string().min(1),
        promptType: PromptTypeSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {
      method: "DELETE"
    }, [validation]);
  }
};

// src/api/tool-api.ts
import z19 from "zod";
var ToolAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async list(assistantId) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.string().min(1)
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools`, assistantId, {}, [validation]);
  }
  async get(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        toolId: z19.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {}, [validation]);
  }
  async create(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        data: CreateToolSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools`, { assistantId, data }, {
      method: "POST"
    }, [validation]);
  }
  async update(assistantId, toolId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        toolId: z19.string().min(1),
        data: UpdateToolSchema
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId, data }, {
      method: "PUT"
    }, [validation]);
  }
  async delete(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        toolId: z19.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {
      method: "DELETE"
    }, [validation]);
  }
  async getVersions(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        toolId: z19.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}/versions`, { assistantId, toolId }, {}, [validation]);
  }
  async rotateSecret(assistantId, toolId) {
    const validation = new ValidationMiddleware({
      inputSchema: z19.object({
        assistantId: z19.string().min(1),
        toolId: z19.string().min(1)
      })
    });
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}/rotate-secret`, { assistantId, toolId }, {
      method: "POST"
    }, [validation]);
  }
};

// src/api/chat-api.ts
import z20 from "zod";
var ChatAPI = class extends BaseClient {
  constructor(baseUrl, clientApiKey, serverApiKey) {
    super(baseUrl, clientApiKey, serverApiKey);
    this.use(new ErrorHandlingMiddleware()).use(new ProtectedMiddleware());
  }
  async send(assistantId, data) {
    const validation = new ValidationMiddleware({
      inputSchema: z20.object({
        assistantId: z20.string().min(1),
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
      inputSchema: z20.object({
        assistantId: z20.string().min(1),
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
export {
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
};
