import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../auth/guards/admin.guard';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ChatMessageDto } from './dto/chat-message.dto';
import { SendChatMessageUseCase } from '../../application/send-chat-message.use-case';
import {
  ChatProviderUnavailableError,
  ChatSessionLimitError,
} from '../../domain/chat-message';

@Controller('chat')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ChatController {
  constructor(private readonly sendChatMessage: SendChatMessageUseCase) {}

  @Post('message')
  async sendMessage(@Body() body: ChatMessageDto): Promise<{ reply: string }> {
    try {
      const reply = await this.sendChatMessage.execute(body.message.trim(), body.history);
      return { reply };
    } catch (error) {
      if (error instanceof ChatSessionLimitError) {
        throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (error instanceof ChatProviderUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      if (error instanceof HttpException) throw error;
      throw error;
    }
  }
}