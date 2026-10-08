import { Module } from '@nestjs/common';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { CandidatesController } from './candidates/candidates.controller';
import { CandidatesService } from './candidates/candidates.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [QuestionsController, MetricsController, CandidatesController],
  providers: [QuestionsService, MetricsService, CandidatesService],
})
export class AdminModule {}
