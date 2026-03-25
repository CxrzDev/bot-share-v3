import type { User, Package, Account, Schedule } from "@prisma/client";

export type { User, Package, Account, Schedule };

export type UserWithPackage = User & {
  package: Package | null;
};

export type AccountWithSchedules = Account & {
  schedules: Schedule[];
};

export type SafeUser = Omit<User, "password"> & {
  package: Package | null;
};

export type PackageTier = "Starter" | "Value" | "Pro";

export type Platform = "FACEBOOK" | "LINE";
export type AccountStatus = "ACTIVE" | "ERROR" | "PENDING";
export type ScheduleStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PAUSED";
export type UserRole = "USER" | "ADMIN";
