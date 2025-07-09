-- CreateTable
CREATE TABLE "professional_profiles" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "level" TEXT,
    "yearsOfExperience" INTEGER,
    "specialization" TEXT,
    "bio" TEXT,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "preferredWorkTypes" JSONB,
    "workStyle" TEXT,
    "communicationStyle" TEXT,
    "careerGoals" JSONB,
    "desiredGrowth" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "yearsUsed" INTEGER,
    "certified" BOOLEAN NOT NULL DEFAULT false,
    "certifiedBy" TEXT,
    "certifiedAt" TIMESTAMP(3),
    "lastAssessed" TIMESTAMP(3),
    "assessmentMethod" TEXT,
    "lastUsed" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "credentialId" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "category" TEXT,
    "level" TEXT,
    "description" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "responsibilities" JSONB,
    "achievements" JSONB,
    "technologies" JSONB,
    "projects" JSONB,
    "performanceRating" DOUBLE PRECISION,
    "teamSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "experience_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "workSchedule" JSONB,
    "timezone" TEXT,
    "workingHours" JSONB,
    "currentStatus" TEXT NOT NULL DEFAULT 'available',
    "statusMessage" TEXT,
    "until" TIMESTAMP(3),
    "plannedAbsences" JSONB,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workload_capacity" (
    "id" TEXT NOT NULL,
    "maxWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "maxConcurrentTasks" INTEGER NOT NULL DEFAULT 5,
    "preferredWorkload" TEXT NOT NULL DEFAULT 'medium',
    "currentWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentTasks" INTEGER NOT NULL DEFAULT 0,
    "workloadUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "stressLevel" TEXT,
    "energyLevel" TEXT,
    "focusLevel" TEXT,
    "capacityHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "workload_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "taskCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageTaskTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "projectSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageProjectTime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "clientSatisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "efficiencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "productivityIndex" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "collaborationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "communicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "skillImprovement" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "knowledgeGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "performanceHistory" JSONB,
    "trends" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "shortTermGoals" JSONB,
    "longTermGoals" JSONB,
    "careerObjectives" JSONB,
    "learningStyle" TEXT,
    "preferredFormat" TEXT,
    "timeCommitment" TEXT,
    "currentCourses" JSONB,
    "learningProgress" JSONB,
    "recommendedSkills" JSONB,
    "recommendedCourses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "description" TEXT,
    "objectives" JSONB,
    "outcomes" JSONB,
    "skillsGained" JSONB,
    "grade" TEXT,
    "certificate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "impactOnWork" TEXT,
    "application" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "training_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_profiles_userId_key" ON "professional_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "availability_userId_key" ON "availability"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workload_capacity_userId_key" ON "workload_capacity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_userId_key" ON "performance_metrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_userId_key" ON "learning_paths"("userId");

-- AddForeignKey
ALTER TABLE "professional_profiles" ADD CONSTRAINT "professional_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_entries" ADD CONSTRAINT "experience_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workload_capacity" ADD CONSTRAINT "workload_capacity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_entries" ADD CONSTRAINT "training_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
