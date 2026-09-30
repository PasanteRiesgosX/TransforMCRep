import { ForbiddenException } from '@nestjs/common';
import { RealtimeFeedbackPort } from '../../ports/realtime-feedback.port';
import { PusherAuthController } from './pusher-auth.controller';

describe('PusherAuthController', () => {
  it('authorizes only the authenticated user private channel', () => {
    const authorizeChannel = jest.fn().mockReturnValue({ auth: 'signed-auth' });
    const realtime = { authorizeChannel } as unknown as RealtimeFeedbackPort;
    const controller = new PusherAuthController(realtime);

    expect(controller.authorizePrivateChannel(
      { user: { id: 'user-1' } },
      { socket_id: '123.456', channel_name: 'private-survey-user-user-1' },
    )).toEqual({ auth: 'signed-auth' });
    expect(authorizeChannel).toHaveBeenCalledWith('123.456', 'private-survey-user-user-1');
  });

  it('rejects another user channel', () => {
    const realtime = { authorizeChannel: jest.fn() } as unknown as RealtimeFeedbackPort;
    const controller = new PusherAuthController(realtime);

    expect(() => controller.authorizePrivateChannel(
      { user: { id: 'user-1' } },
      { socket_id: '123.456', channel_name: 'private-survey-user-user-2' },
    )).toThrow(ForbiddenException);
    expect(realtime.authorizeChannel).not.toHaveBeenCalled();
  });
});