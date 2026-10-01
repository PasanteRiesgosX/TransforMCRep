import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import {
  MAX_CHAT_HISTORY_MESSAGE_CHARACTERS,
  MAX_CHAT_HISTORY_MESSAGES,
  MAX_CHAT_MESSAGE_CHARACTERS,
} from '../../../application/chat-limits';

export class ChatHistoryMessageDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(MAX_CHAT_HISTORY_MESSAGE_CHARACTERS)
  content!: string;
}

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CHAT_MESSAGE_CHARACTERS)
  message!: string;

  @IsArray()
  @ArrayMaxSize(MAX_CHAT_HISTORY_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history!: ChatHistoryMessageDto[];
}