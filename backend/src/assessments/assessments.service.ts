import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: createAssessmentDto.jobId },
    });
    if (!job) {
      throw new NotFoundException(
        `Job with ID ${createAssessmentDto.jobId} not found`,
      );
    }

    return this.prisma.assessment.create({
      data: createAssessmentDto,
    });
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        job: {
          select: { title: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        job: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    return assessment;
  }

  async update(id: string, updateAssessmentDto: UpdateAssessmentDto) {
    await this.findOne(id);

    if (updateAssessmentDto.jobId) {
      const job = await this.prisma.job.findUnique({
        where: { id: updateAssessmentDto.jobId },
      });
      if (!job) {
        throw new NotFoundException(
          `Job with ID ${updateAssessmentDto.jobId} not found`,
        );
      }
    }

    return this.prisma.assessment.update({
      where: { id },
      data: updateAssessmentDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.assessment.delete({
      where: { id },
    });
  }

  async getPublicDetails(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id, status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        passingScore: true,
        job: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Assessment with ID ${id} not found or inactive`,
      );
    }

    return assessment;
  }
}
