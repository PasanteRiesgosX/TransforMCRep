import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendChatMessageUseCase } from '../../application/send-chat-message.use-case';

@Controller('chat')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ChatController {
  constructor(private readonly sendChatMessage: SendChatMessageUseCase) {}

  @Post('message')
  async sendMessage(@Body() body: ChatMessageDto): Promise<{ reply: string }> {
    const reply = await this.sendChatMessage.execute(body.message.trim(), body.history);
    return { reply };
  }
}