// packages/sdk/src/imchat.ts
import { AssistantAPI } from './api/assistant-api'
import { DocumentAPI } from './api/document-api'
import { ProviderAPI } from './api/provider-api'
import { CredentialAPI } from './api/credential-api'
import { SessionAPI } from './api/session-api'
import { MessageAPI } from './api/message-api'
import { PromptAPI } from './api/prompt-api'
import { ToolAPI } from './api/tool-api'
import { ChatAPI } from './api/chat-api'

export interface IMChatConfig {
  apiUrl?: string
  clientApiKey?: string
  serverApiKey?: string
  timeout?: number
}

export class IMChat {
  public assistants: AssistantAPI
  public documents: DocumentAPI
  public providers: ProviderAPI
  public credentials: CredentialAPI
  public sessions: SessionAPI
  public messages: MessageAPI
  public prompts: PromptAPI
  public tools: ToolAPI
  public chat: ChatAPI

  constructor(config: IMChatConfig = {}) {
    const apiUrl = config.apiUrl || 'https://test.dijidemi.com'
    const clientApiKey = config.clientApiKey || ''
    const serverApiKey = config.serverApiKey
    const timeout = config.timeout || 30000

    // Initialize all API modules
    this.assistants = new AssistantAPI(apiUrl, clientApiKey, serverApiKey)
    this.documents = new DocumentAPI(apiUrl, clientApiKey, serverApiKey)
    this.providers = new ProviderAPI(apiUrl, clientApiKey, serverApiKey)
    this.credentials = new CredentialAPI(apiUrl, clientApiKey, serverApiKey)
    this.sessions = new SessionAPI(apiUrl, clientApiKey, serverApiKey)
    this.messages = new MessageAPI(apiUrl, clientApiKey, serverApiKey)
    this.prompts = new PromptAPI(apiUrl, clientApiKey, serverApiKey)
    this.tools = new ToolAPI(apiUrl, clientApiKey, serverApiKey)
    this.chat = new ChatAPI(apiUrl, clientApiKey, serverApiKey)
  }
}

// Default instance
export const imchat = new IMChat()
