import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { ChatCompletionMessage } from '../../domain/chat-message';
import { ChatProviderUnavailableError } from '../../domain/chat-message';
import { ChatCompletionProvider } from '../../ports/chat-completion.port';

@Injectable()
export class GroqChatCompletionAdapter implements ChatCompletionProvider {
  private readonly logger = new Logger(GroqChatCompletionAdapter.name);
  private readonly client: Groq | null;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GROQ_CHAT_API_KEY;
    const model = process.env.GROQ_CHAT_MODEL;
    this.model = model ?? '';
    this.client = apiKey && model
      ? new Groq({ apiKey, maxRetries: 0, timeout: 30_000 })
      : null;

    if (!apiKey) {
      this.logger.warn('GROQ_CHAT_API_KEY is not configured; admin chat is unavailable.');
    } else if (!model) {
      this.logger.warn('GROQ_CHAT_MODEL is not configured; admin chat is unavailable.');
    }
  }

  async complete(messages: ChatCompletionMessage[]): Promise<string> {
    if (!this.client) {
      throw new ChatProviderUnavailableError();
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        max_tokens: 200,
        messages,
      });
      const content = response.choices[0]?.message.content;
      if (!content) throw new Error('Groq returned an empty chat response');
      return content;
    } catch (error) {
      const status = error instanceof Groq.APIError ? error.status : undefined;
      this.logger.error(`Admin chat request failed${status ? ` with HTTP ${status}` : ''}`);
      throw new ChatProviderUnavailableError();
    }
  }
}