import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GroqFeedbackSelector } from '../../application/groq-feedback-selector';
import { AiFeedbackUnavailableError, AiProviderError } from '../../domain/ai-provider-error';
import { SURVEY_REPOSITORY } from '../../ports/survey-repository.port';
import type { SurveyRepository } from '../../ports/survey-repository.port';
import { REALTIME_FEEDBACK } from '../../ports/realtime-feedback.port';
import type { RealtimeFeedbackPort } from '../../ports/realtime-feedback.port';
import { GENERATE_FEEDBACK_JOB, GenerateFeedbackJob, SURVEY_FEEDBACK_QUEUE } from './bullmq-feedback-dispatcher';

@Injectable()
@Processor(SURVEY_FEEDBACK_QUEUE, {
  concurrency: 1,
  drainDelay: 600,
  stalledInterval: 600_000,
})
export class SurveyFeedbackWorker extends WorkerHost {
  private readonly logger = new Logger(SurveyFeedbackWorker.name);

  constructor(
    private readonly selector: GroqFeedbackSelector,
    @Inject(SURVEY_REPOSITORY)
    private readonly surveyRepository: SurveyRepository,
    @Inject(REALTIME_FEEDBACK)
    private readonly realtimeFeedback: RealtimeFeedbackPort,
  ) {
    super();
  }

  async process(job: Job<GenerateFeedbackJob>): Promise<void> {
    if (job.name !== GENERATE_FEEDBACK_JOB) {
      throw new Error(`Unsupported survey feedback job: ${job.name}`);
    }

    let subjectUserId: string | undefined;
    try {
      const attempt = await this.surveyRepository.getFeedbackPayload(job.data.attemptId);
      if (!attempt) {
        await this.surveyRepository.setAiFeedbackStatus(job.data.attemptId, 'FAILED');
        return;
      }
      subjectUserId = attempt.subjectUserId;
      if (attempt.aiFeedbackStatus === 'COMPLETED' || attempt.aiFeedbackStatus === 'FAILED') return;

      await this.surveyRepository.setAiFeedbackStatus(job.data.attemptId, 'PROCESSING');
      const feedback = await this.selector.generateFeedback(attempt.payloadJson);
      await this.surveyRepository.saveAiFeedback(job.data.attemptId, JSON.stringify(feedback));
      await this.realtimeFeedback.notifyFeedbackUpdated(subjectUserId, job.data.attemptId, 'COMPLETED');
    } catch (error) {
      if (error instanceof AiFeedbackUnavailableError || error instanceof AiProviderError) {
        this.logger.warn(`AI feedback failed for survey attempt ${job.data.attemptId}: ${error.message}`);
        await this.surveyRepository.setAiFeedbackStatus(job.data.attemptId, 'FAILED');
        if (subjectUserId) {
          await this.realtimeFeedback.notifyFeedbackUpdated(subjectUserId, job.data.attemptId, 'FAILED');
        }
        return;
      }

      if (job.attemptsMade + 1 >= (job.opts.attempts ?? 1)) {
        try {
          await this.surveyRepository.setAiFeedbackStatus(job.data.attemptId, 'FAILED');
          if (subjectUserId) {
            await this.realtimeFeedback.notifyFeedbackUpdated(subjectUserId, job.data.attemptId, 'FAILED');
          }
        } catch (statusError) {
          this.logger.error(`Could not mark survey attempt ${job.data.attemptId} as failed`, statusError);
        }
      }
      throw error;
    }
  }
}