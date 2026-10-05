import { Module } from '@nestjs/common';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { CandidatesController } from './candidates/candidates.controller';
import { CandidatesService } from './candidates/candidates.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionsController, MetricsController, CandidatesController],
  providers: [QuestionsService, PrismaService, MetricsService, CandidatesService],
})
export class AdminModule {}
