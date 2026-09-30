import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SurveyController } from './survey.controller';
import { PusherAuthController } from './adapters/inbound/pusher-auth.controller';
import { GetSurveyQuestionsUseCase, GetActiveSurveyAttemptUseCase, SaveSurveyProgressUseCase, SubmitSurveyAttemptUseCase, GetSurveyResultsUseCase } from './application/survey-use-cases';
import { GroqFeedbackSelector } from './application/groq-feedback-selector';
import { BullMqFeedbackDispatcher, SURVEY_FEEDBACK_QUEUE } from './adapters/outbound/bullmq-feedback-dispatcher';
import { GroqFeedbackProvider } from './adapters/outbound/groq-feedback.provider';
import { SurveyFeedbackWorker } from './adapters/outbound/survey-feedback.worker';
import { PrismaSurveyRepository } from './adapters/outbound/prisma-survey.repository';
import { RedisGroqRateLimiter } from './adapters/outbound/redis-groq-rate-limiter';
import { PusherRealtimeAdapter } from './adapters/outbound/pusher-realtime.adapter';
import { AI_FEEDBACK_PROVIDER } from './ports/ai-feedback-provider.port';
import { AI_CALL_RATE_LIMITER } from './ports/ai-call-rate-limiter.port';
import { FEEDBACK_DISPATCHER } from './ports/feedback-dispatcher.port';
import { SURVEY_REPOSITORY } from './ports/survey-repository.port';
import { REALTIME_FEEDBACK } from './ports/realtime-feedback.port';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: SURVEY_FEEDBACK_QUEUE }),
  ],
  controllers: [SurveyController, PusherAuthController],
  providers: [
    PrismaService,
    PrismaSurveyRepository,
    { provide: SURVEY_REPOSITORY, useExisting: PrismaSurveyRepository },
    GroqFeedbackProvider,
    { provide: AI_FEEDBACK_PROVIDER, useExisting: GroqFeedbackProvider },
    RedisGroqRateLimiter,
    { provide: AI_CALL_RATE_LIMITER, useExisting: RedisGroqRateLimiter },
    PusherRealtimeAdapter,
    { provide: REALTIME_FEEDBACK, useExisting: PusherRealtimeAdapter },
    {
      provide: GroqFeedbackSelector,
      useFactory: (provider, rateLimiter) => new GroqFeedbackSelector(provider, rateLimiter),
      inject: [AI_FEEDBACK_PROVIDER, AI_CALL_RATE_LIMITER],
    },
    BullMqFeedbackDispatcher,
    SurveyFeedbackWorker,
    { provide: FEEDBACK_DISPATCHER, useExisting: BullMqFeedbackDispatcher },
    {
      provide: GetSurveyQuestionsUseCase,
      useFactory: surveyRepository => new GetSurveyQuestionsUseCase(surveyRepository),
      inject: [SURVEY_REPOSITORY],
    },
    {
      provide: GetActiveSurveyAttemptUseCase,
      useFactory: surveyRepository => new GetActiveSurveyAttemptUseCase(surveyRepository),
      inject: [SURVEY_REPOSITORY],
    },
    {
      provide: SaveSurveyProgressUseCase,
      useFactory: surveyRepository => new SaveSurveyProgressUseCase(surveyRepository),
      inject: [SURVEY_REPOSITORY],
    },
    {
      provide: SubmitSurveyAttemptUseCase,
      useFactory: (surveyRepository, saveProgress, feedbackDispatcher) =>
        new SubmitSurveyAttemptUseCase(surveyRepository, saveProgress, feedbackDispatcher),
      inject: [SURVEY_REPOSITORY, SaveSurveyProgressUseCase, FEEDBACK_DISPATCHER],
    },
    {
      provide: GetSurveyResultsUseCase,
      useFactory: surveyRepository => new GetSurveyResultsUseCase(surveyRepository),
      inject: [SURVEY_REPOSITORY],
    },
  ],
})
export class SurveyModule {}
