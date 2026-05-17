import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays, Plus, CheckCircle2, Circle, Clock,
  LayoutGrid, Archive, ListFilter,
} from "lucide-react";
import { PlannerSidebar } from "@/components/planner/planner-sidebar";
import { TaskCard } from "@/components/planner/task-card";
import { AddTaskForm } from "@/components/planner/add-task-form";
import { EditTaskDialog } from "@/components/planner/edit-task-dialog";
import { AISuggestionsPanel } from "@/components/planner/ai-suggestions-panel";
import { OverviewPanel } from "@/components/planner/overview-panel";
import { getPlannerTasks, upsertPlannerTask, deletePlannerTask } from "@/lib/api/planner";
import type { PlannerTask, TaskStatus } from "@/types/planner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SplitLayout } from "@/components/layout";
import { PageContainer, PageSection } from "@/components/layout";

export const Route = createFileRoute("/planner")({
  component: PlannerPage,
});

type Tab = "schedule" | "overview" | "backlog";
type FilterStatus = "all" | TaskStatus;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function getWeekStart(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function formatDayTitle(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = toDateStr(new Date());
  const tomorrow = toDateStr(addDays(new Date(), 1));
  const yesterday = toDateStr(addDays(new Date(), -1));
  const label =
    dateStr === today ? "Today" :
    dateStr === tomorrow ? "Tomorrow" :
    dateStr === yesterday ? "Yesterday" : null;
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return label ? `${label} — ${weekday}, ${dateLabel}` : `${weekday}, ${dateLabel}`;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

const TABS: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "backlog",  label: "Backlog",  icon: Archive },
];

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: "all",         label: "All"    },
  { id: "in-progress", label: "Active" },
  { id: "todo",        label: "Todo"   },
  { id: "done",        label: "Done"   },
];

export default function PlannerPage() {
  const [tab, setTab] = useState<Tab>("schedule");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const weekEnd = addDays(weekStart, 6);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPlannerTasks(toDateStr(weekStart), toDateStr(weekEnd));
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [weekStart.toISOString()]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (partial: Omit<PlannerTask, "id" | "createdAt" | "updatedAt">) => {
    const tempId = crypto.randomUUID();
    const optimistic: PlannerTask = { ...partial, id: tempId, createdAt: Date.now(), updatedAt: Date.now() };
    setTasks((prev) => [...prev, optimistic]);
    try {
      const saved = await upsertPlannerTask(partial);
      setTasks((prev) => prev.map((t) => t.id === tempId ? saved : t));
    } catch (e: any) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      toast.error(`Failed to add task: ${e.message}`);
    }
  };

  const handleToggle = async (task: PlannerTask) => {
    const newStatus = STATUS_CYCLE[task.status];
    const updated = { ...task, status: newStatus, updatedAt: Date.now() };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try { await upsertPlannerTask(updated); }
    catch (e: any) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
      toast.error(`Failed to update: ${e.message}`);
    }
  };

  const handleSaveEdit = async (task: PlannerTask) => {
    const previous = tasks.find((t) => t.id === task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
    setEditingTask(null);
    try {
      await upsertPlannerTask(task);
      toast.success("Task updated");
    } catch (e: any) {
      if (previous) setTasks((prev) => prev.map((t) => t.id === task.id ? previous : t));
      toast.error(`Failed to save: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deletePlannerTask(id);
      toast.success("Task deleted");
    } catch (e: any) {
      setTasks(previous);
      toast.error(`Failed to delete: ${e.message}`);
    }
  };

  const handlePrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const handleNextWeek = () => setWeekStart((w) => addDays(w, 7));
  const handleToday = () => {
    const today = new Date();
    setSelectedDate(toDateStr(today));
    setWeekStart(getWeekStart(today));
  };
  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setTab("schedule");
    setShowAddForm(false);
  };

  const dayTasks        = tasks.filter((t) => t.date === selectedDate);
  const inProgressTasks = dayTasks.filter((t) => t.status === "in-progress");
  const todoTasks       = dayTasks.filter((t) => t.status === "todo");
  const doneTasks       = dayTasks.filter((t) => t.status === "done");
  const backlogTasks    = tasks.filter((t) => !t.date || t.date === "");

  const allSortedTasks = [
    ...inProgressTasks.sort((a, b) => a.order - b.order),
    ...todoTasks.sort((a, b) => a.order - b.order),
    ...doneTasks.sort((a, b) => a.order - b.order),
  ];
  const filteredTasks = filterStatus === "all"
    ? allSortedTasks
    : allSortedTasks.filter((t) => t.status === filterStatus);

  const totalCount     = dayTasks.length;
  const doneCount      = doneTasks.length;
  const completionPct  = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  /* ── Sidebar passed into SplitLayout ────────────────── */
  const plannerSidebar = (
    <PlannerSidebar
      selectedDate={selectedDate}
      weekStart={weekStart}
      tasks={tasks}
      onSelectDate={handleSelectDate}
      onPrevWeek={handlePrevWeek}
      onNextWeek={handleNextWeek}
      onToday={handleToday}
      onAddTask={() => { setTab("schedule"); setShowAddForm(true); }}
    />
  );

  return (
    <PageContainer>

      {/* ── Header card — identical pattern to all pages ── */}
      <PageSection>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="size-9 sm:size-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
            <CalendarDays className="size-[18px] sm:size-5 text-primary" />
          </div>

          {/* Title */}
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-0.5">
              Workspace
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight leading-tight">Planner</h1>
          </div>

          {/* Tab nav */}
          <nav className="hidden sm:flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 ml-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const badge = t.id === "backlog" ? backlogTasks.length : undefined;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    active
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className={cn("size-3.5 shrink-0", active && "text-primary")} />
                  {t.label}
                  {badge != null && badge > 0 && (
                    <span className={cn(
                      "min-w-[16px] text-center text-[10px] leading-none px-1 py-0.5 rounded-full",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Filter pills */}
          {tab === "schedule" && (
            <div className="hidden md:flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/40">
              <ListFilter className="size-3 text-muted-foreground ml-1 mr-0.5 shrink-0" />
              {FILTERS.map((f) => {
                const count =
                  f.id === "all"         ? dayTasks.length :
                  f.id === "in-progress" ? inProgressTasks.length :
                  f.id === "todo"        ? todoTasks.length : doneTasks.length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilterStatus(f.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                      filterStatus === f.id
                        ? "bg-background text-foreground shadow-sm border border-border/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                    {count > 0 && <span className="text-[9px] font-bold opacity-50">{count}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* New Task */}
          <button
            onClick={() => { setTab("schedule"); setShowAddForm(true); }}
            className="ml-auto inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all shadow-sm shrink-0"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden mt-3 flex items-center gap-2">
          <nav className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/50 flex-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              const badge = t.id === "backlog" ? backlogTasks.length : undefined;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                    active
                      ? "bg-background text-foreground shadow-sm border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-3.5 shrink-0", active && "text-primary")} />
                  {t.label}
                  {badge != null && badge > 0 && (
                    <span className="text-[9px] font-bold text-primary">{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </PageSection>

      {/* ── Split layout — same as every other page ──────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SplitLayout sidebar={plannerSidebar} sidebarWidth="lg:w-[260px]">

          {/* ── SCHEDULE TAB ── */}
          {tab === "schedule" && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Day header */}
              <div className="shrink-0 px-4 sm:px-5 pt-3.5 pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight">
                      {formatDayTitle(selectedDate)}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {totalCount > 0 ? (
                        <>
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="size-3.5" />{doneCount} done
                          </span>
                          {inProgressTasks.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
                              <Clock className="size-3.5" />{inProgressTasks.length} active
                            </span>
                          )}
                          {todoTasks.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Circle className="size-3.5" />{todoTasks.length} todo
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">No tasks scheduled</span>
                      )}
                    </div>

                    {/* Mobile filter pills */}
                    <div className="md:hidden flex items-center gap-1 mt-2 p-0.5 bg-muted/30 rounded-xl border border-border/40 w-fit">
                      <ListFilter className="size-3 text-muted-foreground ml-1 mr-0.5 shrink-0" />
                      {FILTERS.map((f) => {
                        const count =
                          f.id === "all"         ? dayTasks.length :
                          f.id === "in-progress" ? inProgressTasks.length :
                          f.id === "todo"        ? todoTasks.length : doneTasks.length;
                        return (
                          <button
                            key={f.id}
                            onClick={() => setFilterStatus(f.id)}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                              filterStatus === f.id
                                ? "bg-background text-foreground shadow-sm border border-border/50"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {f.label}
                            {count > 0 && <span className="text-[9px] opacity-50">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Completion ring */}
                  {totalCount > 0 && (
                    <div className="shrink-0 relative size-11">
                      <svg className="size-11 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/60" />
                        <circle
                          cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5"
                          strokeDasharray={`${completionPct * 0.879} 87.9`}
                          strokeLinecap="round"
                          className="text-primary transition-all duration-500"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                        {completionPct}%
                      </span>
                    </div>
                  )}
                </div>

                {totalCount > 0 && (
                  <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-5 py-3 space-y-2">
                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs text-muted-foreground">Loading tasks…</p>
                  </div>
                ) : filteredTasks.length === 0 && allSortedTasks.length === 0 ? (
                  <div className="py-14 text-center space-y-2">
                    <CalendarDays className="size-10 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm font-semibold text-muted-foreground">Nothing planned for this day</p>
                    <p className="text-xs text-muted-foreground/50">Add a task or ask the AI assistant</p>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">No {filterStatus} tasks today</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={setEditingTask}
                    />
                  ))
                )}
              </div>

              {/* Pinned bottom: add task + AI assistant */}
              <div className="shrink-0 border-t border-border/50 px-4 sm:px-5 py-3 space-y-2">
                <AddTaskForm
                  key={showAddForm ? "open" : "closed"}
                  date={selectedDate}
                  onAdd={(t) => { handleAddTask(t); setShowAddForm(false); }}
                  onCancel={() => setShowAddForm(false)}
                  initialOpen={showAddForm}
                />
                {!loading && (
                  <AISuggestionsPanel date={selectedDate} tasks={dayTasks} />
                )}
              </div>
            </div>
          )}

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <OverviewPanel tasks={tasks} weekStart={weekStart} />
          )}

          {/* ── BACKLOG TAB ── */}
          {tab === "backlog" && (
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Backlog</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Tasks not yet assigned to a day</p>
                </div>
              </div>

              <AddTaskForm key="backlog-add" date="" onAdd={handleAddTask} />

              {backlogTasks.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Archive className="size-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm font-semibold text-muted-foreground">Backlog is empty</p>
                  <p className="text-xs text-muted-foreground/50">Tasks without a date will appear here</p>
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))
              )}
            </div>
          )}

        </SplitLayout>
      </div>

      <EditTaskDialog
        task={editingTask}
        onSave={handleSaveEdit}
        onClose={() => setEditingTask(null)}
      />
    </PageContainer>
  );
}
