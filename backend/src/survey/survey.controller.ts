import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetActiveSurveyAttemptUseCase,
  GetSurveyQuestionsUseCase,
  GetSurveyResultsUseCase,
  SaveSurveyProgressUseCase,
  SubmitSurveyAttemptUseCase,
} from './application/survey-use-cases';
import { SurveyAttemptNotFoundError, SurveyRequestError } from './domain/survey-errors';
import type { SurveyAnswerInput, SurveyProgressInput } from './domain/survey-models';

@Controller('survey')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(
    private readonly getQuestionsUseCase: GetSurveyQuestionsUseCase,
    private readonly getActiveAttemptUseCase: GetActiveSurveyAttemptUseCase,
    private readonly saveProgressUseCase: SaveSurveyProgressUseCase,
    private readonly submitAttemptUseCase: SubmitSurveyAttemptUseCase,
    private readonly getResultsUseCase: GetSurveyResultsUseCase,
  ) {}

  @Get('questions')
  getQuestions() {
    return this.execute(() => this.getQuestionsUseCase.execute());
  }

  @Get('attempts/current')
  getActiveAttempt(@Request() req: any) {
    return this.execute(() => this.getActiveAttemptUseCase.execute(req.user.id));
  }

  @Post('attempts/:id/progress')
  saveProgress(@Request() req: any, @Param('id') id: string, @Body() progress: SurveyProgressInput) {
    return this.execute(() => this.saveProgressUseCase.execute(req.user.id, id, progress));
  }

  @Post('attempts/:id/submit')
  submitAttempt(@Request() req: any, @Param('id') id: string, @Body() answers: SurveyAnswerInput[]) {
    return this.execute(() => this.submitAttemptUseCase.execute(req.user.id, id, answers));
  }

  @Get('results')
  getResults(@Request() req: any) {
    return this.execute(() => this.getResultsUseCase.execute(req.user.id));
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof SurveyAttemptNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof SurveyRequestError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
