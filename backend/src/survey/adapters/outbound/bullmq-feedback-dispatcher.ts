import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FeedbackDispatcher } from '../../ports/feedback-dispatcher.port';
import { SURVEY_REPOSITORY } from '../../ports/survey-repository.port';
import type { SurveyRepository } from '../../ports/survey-repository.port';

export const SURVEY_FEEDBACK_QUEUE = 'survey-feedback';
export const GENERATE_FEEDBACK_JOB = 'generate-feedback';

export interface GenerateFeedbackJob {
  attemptId: string;
}

@Injectable()
export class BullMqFeedbackDispatcher implements FeedbackDispatcher {
  private readonly logger = new Logger(BullMqFeedbackDispatcher.name);

  constructor(
    @InjectQueue(SURVEY_FEEDBACK_QUEUE)
    private readonly queue: Queue<GenerateFeedbackJob>,
    @Inject(SURVEY_REPOSITORY)
    private readonly surveyRepository: SurveyRepository,
  ) {}

  async dispatch(attemptId: string): Promise<void> {
    try {
      await this.queue.add(
        GENERATE_FEEDBACK_JOB,
        { attemptId },
        {
          jobId: `survey-feedback-${attemptId}`,
          attempts: 2,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: 1_000,
          removeOnFail: 1_000,
        },
      );
    } catch (error) {
      this.logger.error(`Could not enqueue AI feedback for survey attempt ${attemptId}`, error);
      try {
        await this.surveyRepository.setAiFeedbackStatus(attemptId, 'FAILED');
      } catch (statusError) {
        this.logger.error(`Could not update AI feedback status for survey attempt ${attemptId}`, statusError);
      }
    }
  }
}