export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionMessage {
  role: ChatRole | 'system';
  content: string;
}

export class ChatSessionLimitError extends Error {
  constructor() {
    super('La sesión alcanzó el máximo de consultas. Reinicia el chat para continuar.');
    this.name = ChatSessionLimitError.name;
  }
}

export class ChatProviderUnavailableError extends Error {
  constructor() {
    super('El asistente no está disponible temporalmente. Inténtalo nuevamente.');
    this.name = ChatProviderUnavailableError.name;
  }
}