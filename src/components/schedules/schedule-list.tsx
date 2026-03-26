"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteScheduleAction, toggleScheduleStatusAction } from "@/lib/actions/schedule-actions";
import { FacebookIcon } from "@/components/ui/platform-icons";
import {
  Loader2,
  Trash2,
  Pause,
  Play,
  MessageCircle,
  CalendarPlus,
  Clock,
  RotateCcw,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PAUSED";

interface Schedule {
  id: string;
  targetGroup: string;
  messages: string;
  scheduledTime: string;
  loopCount: number;
  runCount: number;
  status: ScheduleStatus;
  errorMessage: string | null;
  account: {
    id: string;
    accountName: string;
    platform: "FACEBOOK" | "LINE";
  };
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; classes: string }> = {
  PENDING: {
    label: "รอดำเนินการ",
    classes: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
  },
  RUNNING: {
    label: "กำลังรัน",
    classes: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  SUCCESS: {
    label: "สำเร็จ",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  FAILED: {
    label: "ล้มเหลว",
    classes: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
  PAUSED: {
    label: "หยุดชั่วคราว",
    classes: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
};

function StatusBadge({ status }: { status: ScheduleStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cfg.classes
      )}
    >
      {status === "RUNNING" && (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function ScheduleActions({ schedule }: { schedule: Schedule }) {
  const [togglePending, startToggle] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const canToggle = schedule.status === "PENDING" || schedule.status === "PAUSED";
  const isPaused = schedule.status === "PAUSED";

  const handleToggle = () => {
    startToggle(async () => {
      const res = await toggleScheduleStatusAction(schedule.id);
      if (res.success) {
        toast.success(
          res.newStatus === "PAUSED" ? "หยุดตารางโพสต์แล้ว" : "เปิดใช้งานตารางโพสต์แล้ว"
        );
      } else {
        toast.error(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("ยืนยันการลบตารางโพสต์นี้?")) return;
    startDelete(async () => {
      const res = await deleteScheduleAction(schedule.id);
      if (res.success) {
        toast.success("ลบตารางโพสต์แล้ว");
      } else {
        toast.error(res.error ?? "เกิดข้อผิดพลาด");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {canToggle && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2.5 text-xs"
          onClick={handleToggle}
          disabled={togglePending || deletePending}
        >
          {togglePending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isPaused ? (
            <Play className="h-3 w-3 text-emerald-600" />
          ) : (
            <Pause className="h-3 w-3 text-amber-600" />
          )}
          {isPaused ? "เปิดใช้" : "หยุด"}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleDelete}
        disabled={togglePending || deletePending}
      >
        {deletePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        ลบ
      </Button>
    </div>
  );
}

// ─── Schedule card ────────────────────────────────────────────────────────────

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  let messages: string[] = [];
  try {
    messages = JSON.parse(schedule.messages) as string[];
  } catch {
    messages = [schedule.messages];
  }

  const scheduledDate = new Date(schedule.scheduledTime);

  return (
    <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Left: info */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Account + status row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium">
              {schedule.account.platform === "FACEBOOK" ? (
                <FacebookIcon className="h-3 w-3 text-blue-600" />
              ) : (
                <MessageCircle className="h-3 w-3 text-green-600" />
              )}
              {schedule.account.accountName}
            </span>
            <StatusBadge status={schedule.status} />
          </div>

          {/* Target group */}
          <div className="flex items-start gap-1.5 text-sm">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{schedule.targetGroup}</span>
          </div>

          {/* Messages preview */}
          <div className="rounded-md border bg-muted/30 px-3 py-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              ข้อความ ({messages.length} รายการ)
            </p>
            <p className="line-clamp-2 text-sm">{messages[0]}</p>
            {messages.length > 1 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                +{messages.length - 1} ข้อความเพิ่มเติม
              </p>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {scheduledDate.toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Loop {schedule.loopCount}x
            </span>
            <span className="flex items-center gap-1">
              <span>รันแล้ว {schedule.runCount} ครั้ง</span>
            </span>
          </div>

          {/* Error message if FAILED */}
          {schedule.status === "FAILED" && schedule.errorMessage && (
            <div className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {schedule.errorMessage}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div className="shrink-0">
          <ScheduleActions schedule={schedule} />
        </div>
      </div>
    </div>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

export function ScheduleList({ schedules }: { schedules: Schedule[] }) {
  const [filter, setFilter] = useState<ScheduleStatus | "ALL">("ALL");

  const filtered =
    filter === "ALL" ? schedules : schedules.filter((s) => s.status === filter);

  const counts = {
    ALL: schedules.length,
    PENDING: schedules.filter((s) => s.status === "PENDING").length,
    RUNNING: schedules.filter((s) => s.status === "RUNNING").length,
    PAUSED: schedules.filter((s) => s.status === "PAUSED").length,
    SUCCESS: schedules.filter((s) => s.status === "SUCCESS").length,
    FAILED: schedules.filter((s) => s.status === "FAILED").length,
  };

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CalendarPlus className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="font-medium">ยังไม่มีตารางโพสต์</p>
        <p className="text-sm text-muted-foreground">สร้างตารางโพสต์ใหม่เพื่อเริ่มต้น</p>
        <Button asChild className="mt-2">
          <Link href="/dashboard/schedules/new">
            <CalendarPlus className="h-4 w-4" />
            สร้างตารางโพสต์
          </Link>
        </Button>
      </div>
    );
  }

  const filterTabs: { key: ScheduleStatus | "ALL"; label: string }[] = [
    { key: "ALL", label: "ทั้งหมด" },
    { key: "PENDING", label: "รอดำเนินการ" },
    { key: "RUNNING", label: "กำลังรัน" },
    { key: "PAUSED", label: "หยุดชั่วคราว" },
    { key: "SUCCESS", label: "สำเร็จ" },
    { key: "FAILED", label: "ล้มเหลว" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const count = counts[tab.key];
          if (tab.key !== "ALL" && count === 0) return null;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === tab.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                filter === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          ไม่มีรายการในหมวดนี้
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  );
}
