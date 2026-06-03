import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttemptsService {
  constructor(private prisma: PrismaService) {}

  async startAttempt(dto: StartAttemptDto) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: dto.assessmentId, status: 'ACTIVE' },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(
        `Assessment with ID ${dto.assessmentId} not found or inactive`,
      );
    }

    // Find or create candidate
    let candidate = await this.prisma.candidate.findFirst({
      where: { email: dto.email },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          city: dto.city,
          experienceYears: dto.experienceYears,
        },
      });
    }

    // Check for previous completed attempts
    const existingSubmittedAttempt = await this.prisma.attempt.findFirst({
      where: {
        candidateId: candidate.id,
        assessmentId: assessment.id,
        submittedAt: { not: null },
      },
    });

    if (existingSubmittedAttempt) {
      throw new BadRequestException(
        'You have already submitted this assessment.',
      );
    }

    // Create new attempt
    const attempt = await this.prisma.attempt.create({
      data: {
        candidateId: candidate.id,
        assessmentId: assessment.id,
        startedAt: new Date(),
      },
    });

    // Strip isCorrect field from options for candidate security
    const secureQuestions = assessment.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
      })),
    }));

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        duration: assessment.duration,
      },
      questions: secureQuestions,
    };
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.submittedAt) {
      throw new BadRequestException('This attempt has already been submitted');
    }

    const questions = attempt.assessment.questions;
    let score = 0;

    // Use transaction to create all answers and update score
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete any existing answers for this attempt (if they saved previously)
      await tx.answer.deleteMany({
        where: { attemptId },
      });

      // 2. Loop through questions to grade and create Answer records
      for (const question of questions) {
        const correctOptions = question.options.filter((o) => o.isCorrect);
        const correctOptionIds = correctOptions.map((o) => o.id);
        const candidateAnswer = dto.answers.find(
          (a) => a.questionId === question.id,
        );

        let isCorrect = false;

        if (candidateAnswer) {
          // Store single choice or true/false answer
          if (
            question.questionType === 'MULTIPLE_CHOICE' ||
            question.questionType === 'TRUE_FALSE'
          ) {
            if (candidateAnswer.selectedOptionId) {
              await tx.answer.create({
                data: {
                  attemptId,
                  questionId: question.id,
                  selectedOptionId: candidateAnswer.selectedOptionId,
                },
              });

              isCorrect = correctOptionIds.includes(
                candidateAnswer.selectedOptionId,
              );
            }
          }
          // Store multiple choice answers
          else if (question.questionType === 'MULTIPLE_CORRECT') {
            const selectedOptionIds = candidateAnswer.selectedOptionIds || [];

            for (const optId of selectedOptionIds) {
              await tx.answer.create({
                data: {
                  attemptId,
                  questionId: question.id,
                  selectedOptionId: optId,
                },
              });
            }

            // Must match correct option ids set exactly
            isCorrect =
              selectedOptionIds.length === correctOptionIds.length &&
              selectedOptionIds.every((id) => correctOptionIds.includes(id)) &&
              correctOptionIds.every((id) => selectedOptionIds.includes(id));
          }
          // Store text/code answer
          else if (question.questionType === 'TEXT') {
            const textAns = candidateAnswer.textAnswer || '';
            await tx.answer.create({
              data: {
                attemptId,
                questionId: question.id,
                textAnswer: textAns,
              },
            });

            // Perform simple case-insensitive comparison if correct option is defined
            const correctText = correctOptions[0]?.optionText
              ?.trim()
              .toLowerCase();
            isCorrect = !!(
              correctText && textAns.trim().toLowerCase() === correctText
            );
          }
        }

        if (isCorrect) {
          score += 1;
        }
      }

      // Calculate percentage
      const totalQuestions = questions.length;
      const percentage =
        totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const submittedAt = new Date();

      // Update attempt in database
      const updatedAttempt = await tx.attempt.update({
        where: { id: attemptId },
        data: {
          submittedAt,
          score,
          percentage,
        },
        include: {
          candidate: true,
          assessment: true,
        },
      });

      return {
        attemptId: updatedAttempt.id,
        candidateName: updatedAttempt.candidate.fullName,
        assessmentTitle: updatedAttempt.assessment.title,
        startedAt: updatedAttempt.startedAt,
        submittedAt: updatedAttempt.submittedAt,
        score: updatedAttempt.score,
        totalQuestions,
        percentage: updatedAttempt.percentage,
        passingScore: updatedAttempt.assessment.passingScore,
        passed:
          updatedAttempt.percentage >= updatedAttempt.assessment.passingScore,
      };
    });
  }

  async getAttemptDetailsForHR(id: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        candidate: true,
        assessment: {
          include: {
            job: true,
            questions: {
              include: {
                options: true,
                answers: {
                  where: { attemptId: id },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    // Map questions with correctness status
    const questionDetails = attempt.assessment.questions.map((q) => {
      const correctOptionIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);
      const userAnswers = q.answers;
      let isCorrect = false;
      let userAnswerText = '';

      if (
        q.questionType === 'MULTIPLE_CHOICE' ||
        q.questionType === 'TRUE_FALSE'
      ) {
        const selectedId = userAnswers[0]?.selectedOptionId;
        isCorrect = !!(selectedId && correctOptionIds.includes(selectedId));
        userAnswerText =
          q.options.find((o) => o.id === selectedId)?.optionText || 'No answer';
      } else if (q.questionType === 'MULTIPLE_CORRECT') {
        const selectedOptionIds = userAnswers
          .map((a) => a.selectedOptionId)
          .filter(Boolean) as string[];
        isCorrect =
          selectedOptionIds.length === correctOptionIds.length &&
          selectedOptionIds.every((id) => correctOptionIds.includes(id));
        userAnswerText =
          selectedOptionIds
            .map((id) => q.options.find((o) => o.id === id)?.optionText)
            .join(', ') || 'No answer';
      } else if (q.questionType === 'TEXT') {
        userAnswerText = userAnswers[0]?.textAnswer || '';
        const correctText = q.options
          .find((o) => o.isCorrect)
          ?.optionText?.trim()
          .toLowerCase();
        isCorrect = !!(
          correctText && userAnswerText.trim().toLowerCase() === correctText
        );
      }

      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        correctAnswers: q.options
          .filter((o) => o.isCorrect)
          .map((o) => o.optionText),
        candidateAnswer: userAnswerText,
        isCorrect,
      };
    });

    return {
      attemptId: attempt.id,
      candidate: attempt.candidate,
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        jobTitle: attempt.assessment.job.title,
        duration: attempt.assessment.duration,
        passingScore: attempt.assessment.passingScore,
      },
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      totalQuestions: attempt.assessment.questions.length,
      percentage: attempt.percentage,
      passed: attempt.percentage >= attempt.assessment.passingScore,
      questions: questionDetails,
    };
  }

  async getAllAttemptsForHR(filters: {
    search?: string;
    jobId?: string;
    assessmentId?: string;
    status?: 'PASSED' | 'FAILED';
  }) {
    const whereClause: Prisma.AttemptWhereInput = {};

    // Filter by search term (candidate name or email)
    if (filters.search) {
      whereClause.candidate = {
        OR: [
          { fullName: { contains: filters.search } },
          { email: { contains: filters.search } },
        ],
      };
    }

    // Filter by job ID
    if (filters.jobId) {
      whereClause.assessment = {
        jobId: filters.jobId,
      };
    }

    // Filter by assessment ID
    if (filters.assessmentId) {
      whereClause.assessmentId = filters.assessmentId;
    }

    // Filter by status (Passed/Failed)
    if (filters.status) {
      whereClause.submittedAt = { not: null };
    }

    let attempts = await this.prisma.attempt.findMany({
      where: whereClause,
      include: {
        candidate: true,
        assessment: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Apply custom in-memory status filter since score vs passingScore comparison is dynamic
    if (filters.status) {
      attempts = attempts.filter((attempt) => {
        const passed = attempt.percentage >= attempt.assessment.passingScore;
        return filters.status === 'PASSED' ? passed : !passed;
      });
    }

    return attempts.map((attempt) => ({
      id: attempt.id,
      candidateName: attempt.candidate.fullName,
      candidateEmail: attempt.candidate.email,
      candidatePhone: attempt.candidate.phone,
      jobTitle: attempt.assessment.job.title,
      assessmentTitle: attempt.assessment.title,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      percentage: attempt.percentage,
      passingScore: attempt.assessment.passingScore,
      passed: attempt.percentage >= attempt.assessment.passingScore,
      candidate: attempt.candidate,
      assessment: attempt.assessment,
    }));
  }

  async exportAttemptsCsv() {
    const attempts = await this.prisma.attempt.findMany({
      where: { submittedAt: { not: null } },
      include: {
        candidate: true,
        assessment: {
          include: {
            job: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const headers =
      'Candidate Name,Email,Phone,City,Experience Years,Job Title,Assessment Title,Started At,Submitted At,Score,Percentage,Status\n';

    const rows = attempts
      .map((attempt) => {
        const status =
          attempt.percentage >= attempt.assessment.passingScore
            ? 'PASSED'
            : 'FAILED';
        const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;

        return [
          escape(attempt.candidate.fullName),
          escape(attempt.candidate.email),
          escape(attempt.candidate.phone),
          escape(attempt.candidate.city),
          attempt.candidate.experienceYears,
          escape(attempt.assessment.job.title),
          escape(attempt.assessment.title),
          attempt.startedAt.toISOString(),
          attempt.submittedAt?.toISOString() || '',
          attempt.score,
          attempt.percentage.toFixed(2),
          status,
        ].join(',');
      })
      .join('\n');

    return headers + rows;
  }
}
