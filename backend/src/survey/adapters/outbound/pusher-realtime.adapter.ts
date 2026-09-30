import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';
import { AiFeedbackStatus } from '../../domain/survey-models';
import { RealtimeFeedbackPort } from '../../ports/realtime-feedback.port';

@Injectable()
export class PusherRealtimeAdapter implements RealtimeFeedbackPort {
  private readonly logger = new Logger(PusherRealtimeAdapter.name);
  private readonly pusher: Pusher | null;

  constructor() {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    if (!appId || !key || !secret || !cluster) {
      this.logger.warn('Pusher credentials are incomplete; realtime AI updates are disabled.');
      this.pusher = null;
      return;
    }

    this.pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  }

  authorizeChannel(socketId: string, channelName: string): { auth: string } {
    if (!this.pusher) {
      throw new Error('Pusher is not configured');
    }

    return this.pusher.authorizeChannel(socketId, channelName);
  }

  async notifyFeedbackUpdated(
    userId: string,
    attemptId: string,
    status: AiFeedbackStatus,
  ): Promise<void> {
    if (!this.pusher) return;

    try {
      await this.pusher.trigger(
        `private-survey-user-${userId}`,
        'ai-feedback-updated',
        { attemptId, status },
      );
    } catch (error) {
      this.logger.warn(`Could not publish Pusher update for survey attempt ${attemptId}: ${String(error)}`);
    }
  }
}