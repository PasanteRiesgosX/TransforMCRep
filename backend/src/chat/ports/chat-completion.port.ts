import { ChatCompletionMessage } from '../domain/chat-message';

export const CHAT_COMPLETION_PROVIDER = Symbol('CHAT_COMPLETION_PROVIDER');

export interface ChatCompletionProvider {
  complete(messages: ChatCompletionMessage[]): Promise<string>;
}