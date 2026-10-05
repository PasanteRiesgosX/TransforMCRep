import { Module } from '@nestjs/common';
import { QuestionsController } from './questions/questions.controller';
import { QuestionsService } from './questions/questions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestionsController, MetricsController],
  providers: [QuestionsService, PrismaService, MetricsService],
})
export class AdminModule {}
