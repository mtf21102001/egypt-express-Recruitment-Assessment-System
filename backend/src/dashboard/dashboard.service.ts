import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const totalJobs = await this.prisma.job.count();
    const totalAssessments = await this.prisma.assessment.count();
    const totalCandidates = await this.prisma.candidate.count();
    const totalAttempts = await this.prisma.attempt.count();

    const completedAttempts = await this.prisma.attempt.findMany({
      where: { submittedAt: { not: null } },
      include: {
        assessment: {
          select: { passingScore: true },
        },
      },
    });

    const totalCompleted = completedAttempts.length;

    let totalScorePercentage = 0;
    let passedCount = 0;
    let failedCount = 0;

    for (const attempt of completedAttempts) {
      totalScorePercentage += attempt.percentage;
      if (attempt.percentage >= attempt.assessment.passingScore) {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    const averagePercentage =
      totalCompleted > 0 ? totalScorePercentage / totalCompleted : 0;

    const latestAttempts = await this.prisma.attempt.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      include: {
        candidate: {
          select: { fullName: true, email: true },
        },
        assessment: {
          select: {
            title: true,
            passingScore: true,
            job: {
              select: { title: true },
            },
          },
        },
      },
    });

    const formattedAttempts = latestAttempts.map((attempt) => ({
      id: attempt.id,
      candidateName: attempt.candidate.fullName,
      candidateEmail: attempt.candidate.email,
      assessmentTitle: attempt.assessment.title,
      jobTitle: attempt.assessment.job.title,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.submittedAt
        ? attempt.percentage >= attempt.assessment.passingScore
        : null,
    }));

    return {
      totalJobs,
      totalAssessments,
      totalCandidates,
      totalAttempts,
      completedAttempts: totalCompleted,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      passedCount,
      failedCount,
      latestAttempts: formattedAttempts,
    };
  }
}
