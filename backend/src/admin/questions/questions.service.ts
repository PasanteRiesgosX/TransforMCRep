import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.question.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async create(userId: string, createDto: CreateQuestionDto) {
    this.validateQuestionLogic(createDto);

    return this.prisma.$transaction(async (tx: any) => {
      // Si es gate, forzamos dimension y rúbrica
      const isGate = createDto.isGate === true;
      const dimension = isGate ? 'No aplica' : createDto.dimension;
      const rubricCategory = isGate ? 'No aplica' : createDto.rubricCategory;

      return tx.question.create({
        data: {
          text: createDto.text,
          type: createDto.type,
          dimension: dimension,
          rubricCategory: rubricCategory,
          weight: createDto.weight,
          isGate: isGate,
          scoreEligible: createDto.scoreEligible ?? true,
          orderIndex: createDto.orderIndex,
          minValue: createDto.type === 'SLIDER' ? createDto.minValue : null,
          maxValue: createDto.type === 'SLIDER' ? createDto.maxValue : null,
          stepValue: createDto.type === 'SLIDER' ? createDto.stepValue : null,
          minLabel: createDto.type === 'SLIDER' ? createDto.minLabel : null,
          maxLabel: createDto.type === 'SLIDER' ? createDto.maxLabel : null,
          passingValue: createDto.type === 'SLIDER' && isGate ? createDto.passingValue : null,
          createdById: userId,
          options: createDto.type === 'MULTIPLE_CHOICE' && createDto.options ? {
            create: createDto.options.map((opt, i) => ({
              text: opt.text,
              value: opt.value,
              orderIndex: opt.orderIndex ?? i,
              isPassing: isGate ? (opt.isPassing || false) : false,
            }))
          } : undefined,
        },
        include: { options: true }
      });
    });
  }

  // La edición de una pregunta con respuestas existentes está permitida, porque 
  // las respuestas guardan snapshot de los campos de la pregunta y de las opciones 
  // en el momento en que se respondieron. Esto evita afectar los intentos históricos.
  async update(id: string, updateDto: UpdateQuestionDto) {
    const existing = await this.findOne(id);
    
    // Merge existing and new values for validation
    const merged = { ...existing, ...updateDto } as any;
    this.validateQuestionLogic(merged);

    return this.prisma.$transaction(async (tx: any) => {
      const isGate = merged.isGate === true;
      const dimension = isGate ? 'No aplica' : merged.dimension;
      const rubricCategory = isGate ? 'No aplica' : merged.rubricCategory;

      // Reconcile options if MULTIPLE_CHOICE
      if (merged.type === 'MULTIPLE_CHOICE' && updateDto.options) {
        // Find options to delete (exist in DB but not in DTO)
        const incomingIds = updateDto.options.map(o => o.id).filter(Boolean);
        await tx.questionOption.deleteMany({
          where: {
            questionId: id,
            id: { notIn: incomingIds }
          }
        });

        // Upsert options
        for (let i = 0; i < updateDto.options.length; i++) {
          const opt = updateDto.options[i];
          if (opt.id) {
            await tx.questionOption.update({
              where: { id: opt.id },
              data: {
                text: opt.text,
                value: opt.value,
                orderIndex: opt.orderIndex ?? i,
                isPassing: isGate ? (opt.isPassing || false) : false,
              }
            });
          } else {
            await tx.questionOption.create({
              data: {
                questionId: id,
                text: opt.text,
                value: opt.value,
                orderIndex: opt.orderIndex ?? i,
                isPassing: isGate ? (opt.isPassing || false) : false,
              }
            });
          }
        }
      } else if (merged.type !== 'MULTIPLE_CHOICE') {
        // Delete any existing options if type changed from MULTIPLE_CHOICE
        await tx.questionOption.deleteMany({ where: { questionId: id } });
      }

      return tx.question.update({
        where: { id },
        data: {
          text: updateDto.text,
          type: updateDto.type,
          dimension: dimension,
          rubricCategory: rubricCategory,
          weight: merged.weight,
          isGate: isGate,
          scoreEligible: merged.scoreEligible ?? true,
          orderIndex: updateDto.orderIndex,
          isActive: updateDto.isActive,
          minValue: merged.type === 'SLIDER' ? updateDto.minValue : null,
          maxValue: merged.type === 'SLIDER' ? updateDto.maxValue : null,
          stepValue: merged.type === 'SLIDER' ? updateDto.stepValue : null,
          minLabel: merged.type === 'SLIDER' ? updateDto.minLabel : null,
          maxLabel: merged.type === 'SLIDER' ? updateDto.maxLabel : null,
          passingValue: merged.type === 'SLIDER' && isGate ? updateDto.passingValue : null,
        },
        include: { options: true }
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id); // ensure exists
    return this.prisma.question.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      }
    });
  }

  async reorder(dto: ReorderQuestionsDto) {
    return this.prisma.$transaction(async (tx: any) => {
      for (const item of dto.items) {
        await tx.question.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        });
      }
      return { success: true };
    });
  }

  private validateQuestionLogic(dto: Partial<CreateQuestionDto>) {
    if (dto.type === 'MULTIPLE_CHOICE') {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException('MULTIPLE_CHOICE requires at least 2 options.');
      }
      for (const opt of dto.options) {
        if (opt.value < 0 || opt.value > 1) {
          throw new BadRequestException('Option values must be between 0 and 1.');
        }
      }
      if (dto.isGate) {
        const hasPassing = dto.options.some(opt => opt.isPassing === true);
        if (!hasPassing) {
          throw new BadRequestException('Un gate de MULTIPLE_CHOICE debe tener al menos una opción aprobatoria.');
        }
      }
    } else if (dto.type === 'SLIDER') {
      const { minValue, maxValue, stepValue, passingValue, isGate } = dto;
      if (minValue === undefined || maxValue === undefined || stepValue === undefined) {
        throw new BadRequestException('SLIDER requires minValue, maxValue and stepValue.');
      }
      if (minValue >= maxValue) {
        throw new BadRequestException('SLIDER minValue must be less than maxValue.');
      }
      if (stepValue <= 0) {
        throw new BadRequestException('SLIDER stepValue must be greater than 0.');
      }
      if (minValue < 1 || maxValue > 10) {
        throw new BadRequestException('SLIDER must be within 1 and 10 scale.');
      }
      // Valida compatibilidad del step
      if ((maxValue - minValue) % stepValue !== 0) {
        throw new BadRequestException('El rango del SLIDER debe ser compatible con el paso.');
      }
      
      if (isGate) {
        if (passingValue === undefined || passingValue === null) {
          throw new BadRequestException('Un gate de SLIDER requiere un valor aprobatorio.');
        }
        if (passingValue < minValue || passingValue > maxValue) {
          throw new BadRequestException('El valor aprobatorio debe estar entre minValue y maxValue.');
        }
        if ((passingValue - minValue) % stepValue !== 0) {
          throw new BadRequestException('El valor aprobatorio debe estar alineado con el paso.');
        }
      }
    }
  }
}
