import { Job } from 'bullmq';
import { GroqFeedbackSelector } from '../../application/groq-feedback-selector';
import { AiFeedbackUnavailableError } from '../../domain/ai-provider-error';
import { SurveyRepository } from '../../ports/survey-repository.port';
import { RealtimeFeedbackPort } from '../../ports/realtime-feedback.port';
import { GENERATE_FEEDBACK_JOB, GenerateFeedbackJob } from './bullmq-feedback-dispatcher';
import { SurveyFeedbackWorker } from './survey-feedback.worker';

function createJob(attemptsMade = 0): Job<GenerateFeedbackJob> {
  return {
    name: GENERATE_FEEDBACK_JOB,
    data: { attemptId: 'attempt-1' },
    attemptsMade,
    opts: { attempts: 2 },
  } as Job<GenerateFeedbackJob>;
}

describe('SurveyFeedbackWorker', () => {
  it('stores successful feedback and completes the attempt', async () => {
    const feedback = { conocimientoGeneral: 1 };
    const selector = { generateFeedback: jest.fn().mockResolvedValue(feedback) } as unknown as GroqFeedbackSelector;
    const repository = {
      getFeedbackPayload: jest.fn().mockResolvedValue({
        payloadJson: '{}',
        subjectUserId: 'user-1',
        aiFeedbackStatus: 'PENDING',
      }),
      setAiFeedbackStatus: jest.fn().mockResolvedValue(undefined),
      saveAiFeedback: jest.fn().mockResolvedValue(undefined),
    } as unknown as SurveyRepository;
    const realtime = { notifyFeedbackUpdated: jest.fn().mockResolvedValue(undefined) } as unknown as RealtimeFeedbackPort;
    const worker = new SurveyFeedbackWorker(selector, repository, realtime);

    await worker.process(createJob());

    expect(repository.setAiFeedbackStatus).toHaveBeenCalledWith('attempt-1', 'PROCESSING');
    expect(repository.saveAiFeedback).toHaveBeenCalledWith('attempt-1', JSON.stringify(feedback));
    expect(realtime.notifyFeedbackUpdated).toHaveBeenCalledWith('user-1', 'attempt-1', 'COMPLETED');
  });

  it('marks expected model exhaustion as failed without asking BullMQ to retry', async () => {
    const selector = {
      generateFeedback: jest.fn().mockRejectedValue(new AiFeedbackUnavailableError()),
    } as unknown as GroqFeedbackSelector;
    const repository = {
      getFeedbackPayload: jest.fn().mockResolvedValue({
        payloadJson: '{}',
        subjectUserId: 'user-1',
        aiFeedbackStatus: 'PENDING',
      }),
      setAiFeedbackStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as SurveyRepository;
    const realtime = { notifyFeedbackUpdated: jest.fn().mockResolvedValue(undefined) } as unknown as RealtimeFeedbackPort;
    const worker = new SurveyFeedbackWorker(selector, repository, realtime);

    await expect(worker.process(createJob())).resolves.toBeUndefined();
    expect(repository.setAiFeedbackStatus).toHaveBeenLastCalledWith('attempt-1', 'FAILED');
    expect(realtime.notifyFeedbackUpdated).toHaveBeenCalledWith('user-1', 'attempt-1', 'FAILED');
  });

  it('rethrows infrastructure failures so BullMQ can retry them', async () => {
    const infrastructureError = new Error('Redis temporarily unavailable');
    const selector = {
      generateFeedback: jest.fn().mockRejectedValue(infrastructureError),
    } as unknown as GroqFeedbackSelector;
    const repository = {
      getFeedbackPayload: jest.fn().mockResolvedValue({
        payloadJson: '{}',
        subjectUserId: 'user-1',
        aiFeedbackStatus: 'PENDING',
      }),
      setAiFeedbackStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as SurveyRepository;
    const realtime = { notifyFeedbackUpdated: jest.fn().mockResolvedValue(undefined) } as unknown as RealtimeFeedbackPort;
    const worker = new SurveyFeedbackWorker(selector, repository, realtime);

    await expect(worker.process(createJob(0))).rejects.toBe(infrastructureError);
    expect(repository.setAiFeedbackStatus).toHaveBeenLastCalledWith('PROCESSING');
  });
});