import { BullMqFeedbackDispatcher, GENERATE_FEEDBACK_JOB, SURVEY_FEEDBACK_QUEUE } from './bullmq-feedback-dispatcher';
import { SurveyRepository } from '../../ports/survey-repository.port';

describe('BullMqFeedbackDispatcher', () => {
  it('enqueues only the attempt ID with bounded worker retries and a stable job ID', async () => {
    const add = jest.fn().mockResolvedValue(undefined);
    const queue = { add } as never;
    const repository = {
      setAiFeedbackStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as SurveyRepository;
    const dispatcher = new BullMqFeedbackDispatcher(queue, repository);

    await dispatcher.dispatch('attempt-123');

    expect(add).toHaveBeenCalledWith(
      GENERATE_FEEDBACK_JOB,
      { attemptId: 'attempt-123' },
      expect.objectContaining({
        jobId: `${SURVEY_FEEDBACK_QUEUE}-attempt-123`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 1_000 },
      }),
    );
  });

  it('marks AI feedback failed when Redis rejects enqueueing but does not throw to the caller', async () => {
    const add = jest.fn().mockRejectedValue(new Error('Redis unavailable'));
    const queue = { add } as never;
    const setAiFeedbackStatus = jest.fn().mockResolvedValue(undefined);
    const repository = { setAiFeedbackStatus } as unknown as SurveyRepository;
    const dispatcher = new BullMqFeedbackDispatcher(queue, repository);

    await expect(dispatcher.dispatch('attempt-123')).resolves.toBeUndefined();
    expect(setAiFeedbackStatus).toHaveBeenCalledWith('attempt-123', 'FAILED');
  });
});