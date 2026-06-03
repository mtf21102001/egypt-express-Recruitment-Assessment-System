import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateQuestionDto, CreateOptionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(createQuestionDto: CreateQuestionDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: createQuestionDto.assessmentId },
    });
    if (!assessment) {
      throw new NotFoundException(
        `Assessment with ID ${createQuestionDto.assessmentId} not found`,
      );
    }

    const { options, ...questionData } = createQuestionDto;

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: questionData,
      });

      if (options && options.length > 0) {
        await tx.option.createMany({
          data: options.map((opt) => ({
            questionId: question.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect ?? false,
          })),
        });
      }

      return tx.question.findUnique({
        where: { id: question.id },
        include: { options: true },
      });
    });
  }

  async findAll(assessmentId?: string) {
    return this.prisma.question.findMany({
      where: assessmentId ? { assessmentId } : undefined,
      include: { options: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }
    return question;
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto) {
    await this.findOne(id);
    const { options, ...questionData } = updateQuestionDto;

    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: questionData,
      });

      if (options) {
        await tx.option.deleteMany({
          where: { questionId: id },
        });

        if (options.length > 0) {
          await tx.option.createMany({
            data: options.map((opt: CreateOptionDto) => ({
              questionId: id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect ?? false,
            })),
          });
        }
      }

      return tx.question.findUnique({
        where: { id },
        include: { options: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
