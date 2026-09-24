import { Module } from '@nestjs/common';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { ScoringService } from './scoring.service';
import { AiFeedbackService } from './ai-feedback.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SurveyController],
  providers: [SurveyService, ScoringService, AiFeedbackService, PrismaService],
})
export class SurveyModule {}
