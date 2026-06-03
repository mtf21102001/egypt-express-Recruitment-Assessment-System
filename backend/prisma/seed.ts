import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  await prisma.answer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding data...');

  // 1. Create HR Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const hrUser = await prisma.user.create({
    data: {
      name: 'HR Coordinator',
      email: 'hr@company.com',
      password: hashedPassword,
      role: 'HR',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'HR Admin Manager',
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created users:', hrUser.email, adminUser.email);

  // 2. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: 'Full Stack Node.js Engineer',
      description: 'Looking for a skilled developer proficient in NestJS, React, TypeScript, and SQL databases. Will design scalable APIs and collaborate on our core SaaS portal.',
      status: 'ACTIVE',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Senior Frontend Developer (Next.js)',
      description: 'Seeking a senior engineer specialized in Next.js App Router, advanced CSS layout systems, responsive UI components, and modern Web performance optimizations.',
      status: 'ACTIVE',
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Associate Product Manager',
      description: 'Help define product requirements, build wireframes, manage the sprint backlog, and perform user research for our new HR Recruitment platform.',
      status: 'ACTIVE',
    },
  });

  await prisma.job.create({
    data: {
      title: 'QA Automation Engineer',
      description: 'Build robust end-to-end browser automation suites using Playwright, write integration tests, and optimize continuous deployment validation pipelines.',
      status: 'ACTIVE',
    },
  });

  await prisma.job.create({
    data: {
      title: 'DevOps / Infrastructure Specialist',
      description: 'Manage AWS services, establish secure CI/CD pipelines with GitHub Actions, containerize applications, and maintain zero-downtime cluster configurations.',
      status: 'INACTIVE', // Archived/Closed position
    },
  });

  console.log('Created 5 jobs.');

  // 3. Create Assessments
  const assess1 = await prisma.assessment.create({
    data: {
      jobId: job1.id,
      title: 'Node.js & Backend Architecture Challenge',
      description: 'Covers NestJS Dependency Injection, relational databases, transaction handling, security parameters, and Node.js event-loop concepts.',
      duration: 20, // 20 minutes
      passingScore: 70, // 70% threshold
      status: 'ACTIVE',
    },
  });

  const assess2 = await prisma.assessment.create({
    data: {
      jobId: job2.id,
      title: 'Modern React & Web Performance Evaluation',
      description: 'Tests knowledge of React 19 Concurrent Features, Next.js Server Components, state management, CSS layouts, and loading optimization techniques.',
      duration: 15,
      passingScore: 60,
      status: 'ACTIVE',
    },
  });

  await prisma.assessment.create({
    data: {
      jobId: job3.id,
      title: 'Product Strategy & UX Assessment',
      description: 'Covers user-centric product requirements writing, usability heuristics, wireframing decisions, and sprint prioritization frameworks.',
      duration: 30,
      passingScore: 65,
      status: 'ACTIVE',
    },
  });

  console.log('Created 3 assessments.');

  // 4. Create Questions for Node.js Assessment
  const q1 = await prisma.question.create({
    data: {
      assessmentId: assess1.id,
      questionText: 'Which decorator in NestJS is used to bind middleware, guards, filters, or interceptors globally or at the controller level?',
      questionType: 'MULTIPLE_CHOICE',
      options: {
        create: [
          { optionText: '@UseGuards() / @UseInterceptors()', isCorrect: true },
          { optionText: '@Injectable()', isCorrect: false },
          { optionText: '@Module()', isCorrect: false },
          { optionText: '@Catch()', isCorrect: false },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      assessmentId: assess1.id,
      questionText: 'Select all features that describe Node.js Core architecture correctly:',
      questionType: 'MULTIPLE_CORRECT',
      options: {
        create: [
          { optionText: 'Single-threaded event loop model', isCorrect: true },
          { optionText: 'Non-blocking asynchronous I/O operations', isCorrect: true },
          { optionText: 'Fully multi-threaded processing for all application scripts', isCorrect: false },
          { optionText: 'Utilizes libuv library under the hood for OS bindings', isCorrect: true },
        ],
      },
    },
  });

  const q3 = await prisma.question.create({
    data: {
      assessmentId: assess1.id,
      questionText: 'Is it true that SQLite supports full concurrent network connections from multiple remote application servers natively?',
      questionType: 'TRUE_FALSE',
      options: {
        create: [
          { optionText: 'True', isCorrect: false },
          { optionText: 'False', isCorrect: true },
        ],
      },
    },
  });

  const q4 = await prisma.question.create({
    data: {
      assessmentId: assess1.id,
      questionText: 'Explain the difference between a Relational database (like PostgreSQL) and a Non-relational database (like MongoDB). When should you choose one over the other?',
      questionType: 'TEXT',
    },
  });

  // 5. Create Questions for React/Frontend Assessment
  const fq1 = await prisma.question.create({
    data: {
      assessmentId: assess2.id,
      questionText: 'In React, what does the useMemo hook accomplish?',
      questionType: 'MULTIPLE_CHOICE',
      options: {
        create: [
          { optionText: 'Memoizes the computed result of an expensive calculation across renders', isCorrect: true },
          { optionText: 'Allows scheduling state updates inside macro-tasks asynchronously', isCorrect: false },
          { optionText: 'Prevents component re-renders completely in all cases', isCorrect: false },
          { optionText: 'Triggers rendering loops automatically', isCorrect: false },
        ],
      },
    },
  });

  const fq2 = await prisma.question.create({
    data: {
      assessmentId: assess2.id,
      questionText: 'Which of the following are benefits of Next.js Server Components (RSC)? Select all that apply:',
      questionType: 'MULTIPLE_CORRECT',
      options: {
        create: [
          { optionText: 'Reduced JavaScript bundle size sent to the client browser', isCorrect: true },
          { optionText: 'Direct secure access to backend databases or services', isCorrect: true },
          { optionText: 'Automatic interactive state-management hooks like useState and useEffect', isCorrect: false },
          { optionText: 'Improved search engine optimization (SEO) due to faster initial HTML loading', isCorrect: true },
        ],
      },
    },
  });

  const fq3 = await prisma.question.create({
    data: {
      assessmentId: assess2.id,
      questionText: 'Flexbox is primarily designed for layout in one dimension (row OR column), whereas Grid is designed for two dimensions.',
      questionType: 'TRUE_FALSE',
      options: {
        create: [
          { optionText: 'True', isCorrect: true },
          { optionText: 'False', isCorrect: false },
        ],
      },
    },
  });

  const fq4 = await prisma.question.create({
    data: {
      assessmentId: assess2.id,
      questionText: 'Write a short description of the "Core Web Vitals" metrics. Explain what LCP, FID (or INP), and CLS stand for and how to optimize them.',
      questionType: 'TEXT',
    },
  });

  console.log('Created questions and answer options.');

  // 6. Create Candidates
  const cand1 = await prisma.candidate.create({
    data: {
      fullName: 'Youssef Mansour',
      email: 'youssef.mansour@gmail.com',
      phone: '+201012345678',
      city: 'Cairo',
      experienceYears: 4,
    },
  });

  const cand2 = await prisma.candidate.create({
    data: {
      fullName: 'Amira Hegazi',
      email: 'amira.hegazi@outlook.com',
      phone: '+201287654321',
      city: 'Alexandria',
      experienceYears: 6,
    },
  });

  const cand3 = await prisma.candidate.create({
    data: {
      fullName: 'Omar Abdelaziz',
      email: 'omar.abdelaziz@yahoo.com',
      phone: '+201598765432',
      city: 'Giza',
      experienceYears: 2,
    },
  });

  const cand4 = await prisma.candidate.create({
    data: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+14155552671',
      city: 'San Francisco',
      experienceYears: 5,
    },
  });

  const cand5 = await prisma.candidate.create({
    data: {
      fullName: 'John Doe',
      email: 'john.doe@test.com',
      phone: '+447911123456',
      city: 'London',
      experienceYears: 1,
    },
  });

  const cand6 = await prisma.candidate.create({
    data: {
      fullName: 'Fatma Salem',
      email: 'fatma.salem@gmail.com',
      phone: '+201143210987',
      city: 'Tanta',
      experienceYears: 3,
    },
  });

  console.log('Created 6 candidates.');

  // 7. Create Attempts & Answers
  // Get options IDs for query answers
  const optionsQ1 = await prisma.option.findMany({ where: { questionId: q1.id } });
  const optionsQ2 = await prisma.option.findMany({ where: { questionId: q2.id } });
  const optionsQ3 = await prisma.option.findMany({ where: { questionId: q3.id } });

  const optionsFq1 = await prisma.option.findMany({ where: { questionId: fq1.id } });
  const optionsFq2 = await prisma.option.findMany({ where: { questionId: fq2.id } });
  const optionsFq3 = await prisma.option.findMany({ where: { questionId: fq3.id } });

  // Attempt 1: Youssef Mansour -> Node.js Assessment (PASSED)
  // Score: 3/3 correct options (excluding Text which is reviewed manually). Let's grade it as 100%
  const attempt1 = await prisma.attempt.create({
    data: {
      candidateId: cand1.id,
      assessmentId: assess1.id,
      startedAt: new Date(Date.now() - 3600 * 1000 * 2), // 2 hours ago
      submittedAt: new Date(Date.now() - 3600 * 1000 * 1.7), // submitted 1.7 hours ago
      score: 3.0,
      percentage: 100.0,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        attemptId: attempt1.id,
        questionId: q1.id,
        selectedOptionId: optionsQ1.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt1.id,
        questionId: q2.id,
        // Since schema only permits single selectedOptionId per answer model, for multi-select,
        // we can log multiple answers for the same question or log a primary correct one.
        // Let's create answers for each selected option!
        selectedOptionId: optionsQ2.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt1.id,
        questionId: q3.id,
        selectedOptionId: optionsQ3.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt1.id,
        questionId: q4.id,
        textAnswer: 'Relational databases use tables, rows, and foreign keys. They guarantee strict ACID consistency. Non-relational databases use flexible document-like formats (like JSON in MongoDB) and offer fast horizontal scaling. I choose SQL when working with financial records or complex data associations, and NoSQL when database structures change rapidly or require raw write speeds.',
      },
    ],
  });

  // Attempt 2: Amira Hegazi -> React Assessment (PASSED)
  // Score: 3/3 (100%)
  const attempt2 = await prisma.attempt.create({
    data: {
      candidateId: cand2.id,
      assessmentId: assess2.id,
      startedAt: new Date(Date.now() - 3600 * 1000 * 24), // 24 hours ago
      submittedAt: new Date(Date.now() - 3600 * 1000 * 23.8),
      score: 3.0,
      percentage: 100.0,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        attemptId: attempt2.id,
        questionId: fq1.id,
        selectedOptionId: optionsFq1.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt2.id,
        questionId: fq2.id,
        selectedOptionId: optionsFq2.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt2.id,
        questionId: fq3.id,
        selectedOptionId: optionsFq3.find((o) => o.isCorrect)?.id || null,
      },
      {
        attemptId: attempt2.id,
        questionId: fq4.id,
        textAnswer: 'LCP (Largest Contentful Paint) measures page load speed - when the primary content has rendered. FID (First Input Delay) measures user responsiveness. CLS (Cumulative Layout Shift) measures visual structure stability. We can optimize them by lazy-loading images, using CDN edge networks, and declaring explicit size attributes on UI blocks.',
      },
    ],
  });

  // Attempt 3: Omar Abdelaziz -> Node.js Assessment (FAILED)
  // Score: 1/3 (33%)
  const attempt3 = await prisma.attempt.create({
    data: {
      candidateId: cand3.id,
      assessmentId: assess1.id,
      startedAt: new Date(Date.now() - 3600 * 1000 * 4), // 4 hours ago
      submittedAt: new Date(Date.now() - 3600 * 1000 * 3.7),
      score: 1.0,
      percentage: 33.3,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        attemptId: attempt3.id,
        questionId: q1.id,
        selectedOptionId: optionsQ1.find((o) => !o.isCorrect)?.id || null, // Incorrect
      },
      {
        attemptId: attempt3.id,
        questionId: q2.id,
        selectedOptionId: optionsQ2.find((o) => o.isCorrect)?.id || null, // Correct one
      },
      {
        attemptId: attempt3.id,
        questionId: q3.id,
        selectedOptionId: optionsQ3.find((o) => !o.isCorrect)?.id || null, // Incorrect
      },
      {
        attemptId: attempt3.id,
        questionId: q4.id,
        textAnswer: 'SQL is like a folder system, NoSQL is just files. I do not know too much about scaling.',
      },
    ],
  });

  // Attempt 4: Sarah Jenkins -> React Assessment (PASSED)
  // Score: 2/3 (66.7%)
  const attempt4 = await prisma.attempt.create({
    data: {
      candidateId: cand4.id,
      assessmentId: assess2.id,
      startedAt: new Date(Date.now() - 3600 * 1000 * 48), // 2 days ago
      submittedAt: new Date(Date.now() - 3600 * 1000 * 47.75),
      score: 2.0,
      percentage: 66.7,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        attemptId: attempt4.id,
        questionId: fq1.id,
        selectedOptionId: optionsFq1.find((o) => o.isCorrect)?.id || null, // Correct
      },
      {
        attemptId: attempt4.id,
        questionId: fq2.id,
        selectedOptionId: optionsFq2.find((o) => !o.isCorrect)?.id || null, // Incorrect
      },
      {
        attemptId: attempt4.id,
        questionId: fq3.id,
        selectedOptionId: optionsFq3.find((o) => o.isCorrect)?.id || null, // Correct
      },
      {
        attemptId: attempt4.id,
        questionId: fq4.id,
        textAnswer: 'Core web vitals are standard usability metrics developed by Google to guide design performance.',
      },
    ],
  });

  // Attempt 5: John Doe -> Node.js Assessment (IN_PROGRESS - unfinished, no submittedAt)
  const attempt5 = await prisma.attempt.create({
    data: {
      candidateId: cand5.id,
      assessmentId: assess1.id,
      startedAt: new Date(Date.now() - 600 * 1000), // started 10 mins ago
      submittedAt: null, // Still active
      score: 0,
      percentage: 0,
    },
  });

  await prisma.answer.create({
    data: {
      attemptId: attempt5.id,
      questionId: q1.id,
      selectedOptionId: optionsQ1.find((o) => o.isCorrect)?.id || null, // Answered first question
    },
  });

  // Attempt 6: Fatma Salem -> React Assessment (FAILED)
  // Score: 1/3 (33%)
  const attempt6 = await prisma.attempt.create({
    data: {
      candidateId: cand6.id,
      assessmentId: assess2.id,
      startedAt: new Date(Date.now() - 3600 * 1000 * 12), // 12 hours ago
      submittedAt: new Date(Date.now() - 3600 * 1000 * 11.8),
      score: 1.0,
      percentage: 33.3,
    },
  });

  await prisma.answer.createMany({
    data: [
      {
        attemptId: attempt6.id,
        questionId: fq1.id,
        selectedOptionId: optionsFq1.find((o) => !o.isCorrect)?.id || null, // Incorrect
      },
      {
        attemptId: attempt6.id,
        questionId: fq2.id,
        selectedOptionId: optionsFq2.find((o) => !o.isCorrect)?.id || null, // Incorrect
      },
      {
        attemptId: attempt6.id,
        questionId: fq3.id,
        selectedOptionId: optionsFq3.find((o) => o.isCorrect)?.id || null, // Correct
      },
      {
        attemptId: attempt6.id,
        questionId: fq4.id,
        textAnswer: 'Optimizations are done through styling and script tags.',
      },
    ],
  });

  console.log('Created 6 attempts (4 passed, 1 failed, 1 in-progress).');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
