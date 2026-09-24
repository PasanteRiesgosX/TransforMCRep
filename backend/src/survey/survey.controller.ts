import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('survey')
@UseGuards(JwtAuthGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Get('questions')
  getQuestions() {
    return this.surveyService.getQuestions();
  }

  @Get('attempts/current')
  getActiveAttempt(@Request() req: any) {
    return this.surveyService.getActiveAttempt(req.user.id);
  }

  @Post('attempts/:id/progress')
  saveProgress(@Request() req: any, @Param('id') id: string, @Body() progress: any) {
    return this.surveyService.saveProgress(req.user.id, id, progress);
  }

  @Post('attempts/:id/submit')
  submitAttempt(@Request() req: any, @Param('id') id: string, @Body() answers: any[]) {
    return this.surveyService.submitAttempt(req.user.id, id, answers);
  }

  @Get('results')
  getResults(@Request() req: any) {
    return this.surveyService.getResults(req.user.id);
  }
}
