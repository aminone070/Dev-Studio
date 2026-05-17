import { useState, useEffect } from "react";
import {
  BookOpen,
  CheckSquare,
  ExternalLink,
  GraduationCap,
  Search,
  Plus,
  ClipboardList,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import type { SkillAreaData } from "@/types/skills";
import { OverviewSection } from "./overview-section";
import { ChecklistSection } from "./checklist-section";
import { InterviewSection } from "./interview-section";
import { ResourcesSection } from "./resources-section";
import { TasksSection } from "./tasks-section";
import { ProjectsSection } from "./projects-section";
import { SplitLayout } from "../layout";
import { TabNav } from "../layout";
import { cn } from "@/lib/utils";

type SectionId = "overview" | "checklist" | "interview" | "resources" | "tasks" | "projects";

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",       icon: BookOpen },
  { id: "checklist", label: "Checklist",       icon: CheckSquare },
  { id: "interview", label: "Interview Q&A",   icon: GraduationCap },
  { id: "resources", label: "Resources",       icon: ExternalLink },
  { id: "tasks",     label: "Tasks",           icon: ClipboardList },
  { id: "projects",  label: "Projects",        icon: FolderOpen },
];

const ADD_SECTIONS: SectionId[] = ["interview", "tasks", "projects"];

export function SkillArea({
  data,
  activeSubArea,
}: {
  data: SkillAreaData;
  activeSubArea?: string;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [subArea, setSubArea] = useState<string>(
    activeSubArea || data.subAreas?.[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [addTrigger, setAddTrigger] = useState(0);

  useEffect(() => {
    if (activeSubArea) setSubArea(activeSubArea);
  }, [activeSubArea]);

  useEffect(() => {
    setSubArea(data.subAreas?.[0]?.id || "");
    setActiveSection("overview");
    setSearchQuery("");
  }, [data.id]);

  const filteredSubAreas = data.subAreas?.filter((sa) =>
    sa.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const canAdd = ADD_SECTIONS.includes(activeSection);

  const handleAdd = () => {
    if (canAdd) setAddTrigger((n) => n + 1);
  };

  const addLabel =
    activeSection === "tasks"
      ? "Add Task"
      : activeSection === "projects"
        ? "Add Project"
        : activeSection === "interview"
          ? "Add Q&A"
          : "Add";

  /* ── Sidebar ─────────────────────────────────────────── */
  const sidebar = (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/60 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <data.icon className="size-3.5" />
          </div>
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 truncate">
            {data.label}
          </span>
          <button
            onClick={handleAdd}
            title={addLabel}
            className={cn(
              "size-6 rounded-lg flex items-center justify-center transition-all",
              canAdd
                ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                : "text-muted-foreground/25 cursor-default pointer-events-none",
            )}
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {/* Search */}
        {data.subAreas && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              placeholder={data.id === "softskills" ? "Filter topics…" : "Filter stacks…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/60 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
        )}
      </div>

      {/* Stacks / Topics list */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {data.subAreas && (
          <div>
            <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              {data.id === "softskills" ? "Topics" : "Stacks / Frameworks"}
            </p>
            <nav className="space-y-0.5">
              {filteredSubAreas?.map((sa) => {
                const SaIcon = sa.icon;
                const active = subArea === sa.id;
                return (
                  <button
                    key={sa.id}
                    onClick={() => setSubArea(sa.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {SaIcon && <SaIcon className="size-3 shrink-0" />}
                      <span className={active ? "text-foreground" : ""}>{sa.label}</span>
                    </div>
                    {active && <ChevronRight className="size-3 text-primary shrink-0" />}
                  </button>
                );
              })}
              {filteredSubAreas?.length === 0 && (
                <p className="text-[10px] text-center text-muted-foreground py-6 italic">
                  No matching topics found
                </p>
              )}
            </nav>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Main content ─────────────────────────────────────── */
  return (
    <SplitLayout sidebar={sidebar} sidebarWidth="lg:w-[240px]">
      <div className="h-full flex flex-col overflow-hidden">
        {/* Inner tab nav */}
        <div className="px-4 pt-4 pb-3 border-b border-border/60 shrink-0">
          <TabNav
            tabs={SECTIONS.map((s) => ({
              id: s.id,
              label: s.label,
              icon: s.icon,
              onClick: () => setActiveSection(s.id),
            }))}
            activeTab={activeSection}
          />
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="w-full max-w-[1200px] mx-auto p-4 sm:p-8">
            {activeSection === "overview" && (
              <OverviewSection data={data} subArea={subArea} onSubAreaChange={setSubArea} />
            )}
            {activeSection === "checklist" && <ChecklistSection data={data} />}
            {activeSection === "interview" && (
              <InterviewSection data={data} triggerAdd={addTrigger} />
            )}
            {activeSection === "resources" && (
              <ResourcesSection data={data} subArea={subArea} />
            )}
            {activeSection === "tasks" && (
              <TasksSection data={data} triggerAdd={addTrigger} />
            )}
            {activeSection === "projects" && (
              <ProjectsSection data={data} triggerAdd={addTrigger} />
            )}
          </div>
        </div>
      </div>
    </SplitLayout>
  );
}
