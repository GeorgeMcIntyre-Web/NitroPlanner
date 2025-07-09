-- AlterTable
ALTER TABLE "work_units" ADD COLUMN     "assignedEquipmentId" TEXT;

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "manufacturer" TEXT,
    "serialNumber" TEXT,
    "equipmentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "specifications" JSONB,
    "capabilities" JSONB,
    "materials" JSONB,
    "dimensions" JSONB,
    "powerRequirements" JSONB,
    "location" TEXT,
    "department" TEXT,
    "installationDate" TIMESTAMP(3),
    "lastCalibration" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lifecycleStage" TEXT NOT NULL DEFAULT 'operational',
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "expectedLifespan" INTEGER,
    "purchaseCost" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "operatingCost" DOUBLE PRECISION,
    "maintenanceCost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_status" (
    "id" TEXT NOT NULL,
    "operationalStatus" TEXT NOT NULL DEFAULT 'idle',
    "currentJob" TEXT,
    "jobProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "temperature" DOUBLE PRECISION,
    "vibration" DOUBLE PRECISION,
    "noise" DOUBLE PRECISION,
    "powerConsumption" DOUBLE PRECISION,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "alertLevel" TEXT NOT NULL DEFAULT 'normal',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availabilityReason" TEXT,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "equipment_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_capacity" (
    "id" TEXT NOT NULL,
    "maxOperatingHours" DOUBLE PRECISION NOT NULL DEFAULT 24.0,
    "maxWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 168.0,
    "maxConcurrentJobs" INTEGER NOT NULL DEFAULT 1,
    "currentOperatingHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentJobs" INTEGER NOT NULL DEFAULT 0,
    "dailyUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weeklyUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "monthlyUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "operatingSchedule" JSONB,
    "maintenanceSchedule" JSONB,
    "downtimeSchedule" JSONB,
    "capacityHistory" JSONB,
    "utilizationTrends" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "equipment_capacity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_metrics" (
    "id" TEXT NOT NULL,
    "uptime" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "efficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "throughput" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cycleTime" DOUBLE PRECISION,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "defectRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "mttf" DOUBLE PRECISION,
    "mttr" DOUBLE PRECISION,
    "availability" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "energyEfficiency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "costPerUnit" DOUBLE PRECISION,
    "costPerHour" DOUBLE PRECISION,
    "performanceHistory" JSONB,
    "qualityHistory" JSONB,
    "trends" JSONB,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "equipment_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "cost" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "performedDate" TIMESTAMP(3) NOT NULL,
    "nextScheduled" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'completed',
    "outcome" TEXT,
    "notes" TEXT,
    "partsUsed" JSONB,
    "materialsUsed" JSONB,
    "preMaintenanceChecks" JSONB,
    "postMaintenanceChecks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_records" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "jobId" TEXT,
    "operatorId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "unitsProduced" INTEGER,
    "qualityScore" DOUBLE PRECISION,
    "parameters" JSONB,
    "settings" JSONB,
    "issues" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "operation_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_status_equipmentId_key" ON "equipment_status"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_capacity_equipmentId_key" ON "equipment_capacity"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_metrics_equipmentId_key" ON "equipment_metrics"("equipmentId");

-- AddForeignKey
ALTER TABLE "work_units" ADD CONSTRAINT "work_units_assignedEquipmentId_fkey" FOREIGN KEY ("assignedEquipmentId") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_status" ADD CONSTRAINT "equipment_status_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_capacity" ADD CONSTRAINT "equipment_capacity_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_metrics" ADD CONSTRAINT "equipment_metrics_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
