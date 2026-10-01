import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroqChatCompletionAdapter } from './adapters/outbound/groq-chat-completion.adapter';
import { DiskGuidelinesContextAdapter } from './adapters/outbound/disk-guidelines-context.adapter';
import { ChatController } from './adapters/inbound/chat.controller';
import { SendChatMessageUseCase } from './application/send-chat-message.use-case';
import { CHAT_COMPLETION_PROVIDER } from './ports/chat-completion.port';
import { GUIDELINES_CONTEXT } from './ports/guidelines-context.port';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [
    GroqChatCompletionAdapter,
    DiskGuidelinesContextAdapter,
    { provide: CHAT_COMPLETION_PROVIDER, useExisting: GroqChatCompletionAdapter },
    { provide: GUIDELINES_CONTEXT, useExisting: DiskGuidelinesContextAdapter },
    {
      provide: SendChatMessageUseCase,
      useFactory: (completionProvider, guidelinesContext) =>
        new SendChatMessageUseCase(completionProvider, guidelinesContext),
      inject: [CHAT_COMPLETION_PROVIDER, GUIDELINES_CONTEXT],
    },
  ],
})
export class ChatModule {}