import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { REALTIME_FEEDBACK } from '../../ports/realtime-feedback.port';
import type { RealtimeFeedbackPort } from '../../ports/realtime-feedback.port';

@Controller('survey/realtime')
@UseGuards(JwtAuthGuard)
export class PusherAuthController {
  constructor(
    @Inject(REALTIME_FEEDBACK)
    private readonly realtimeFeedback: RealtimeFeedbackPort,
  ) {}

  @Post('auth')
  @HttpCode(HttpStatus.OK)
  authorizePrivateChannel(@Request() request: any, @Body() body: unknown) {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException('Invalid Pusher authorization payload');
    }

    const { socket_id: socketId, channel_name: channelName } = body as Record<string, unknown>;
    if (typeof socketId !== 'string' || typeof channelName !== 'string') {
      throw new BadRequestException('Pusher socket_id and channel_name are required');
    }

    const authorizedChannel = `private-survey-user-${request.user.id}`;
    if (channelName !== authorizedChannel) {
      throw new ForbiddenException('Not authorized to subscribe to this channel');
    }

    try {
      return this.realtimeFeedback.authorizeChannel(socketId, channelName);
    } catch {
      throw new BadRequestException('Pusher channel authorization is unavailable');
    }
  }
}