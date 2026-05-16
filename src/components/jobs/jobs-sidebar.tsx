import { Plus, Briefcase } from "lucide-react";
import type { SavedJob } from "./types";
import { STATUS_COLORS, JOB_STATUSES } from "./types";

interface Props {
  jobs: SavedJob[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function JobsSidebar({ jobs, activeId, onSelect, onAdd }: Props) {
  const grouped = JOB_STATUSES.reduce<Record<string, SavedJob[]>>((acc, s) => {
    acc[s] = jobs.filter((j) => j.status === s);
    return acc;
  }, {} as any);

  const statusLabel: Record<string, string> = {
    saved: "Saved",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Saved Jobs ({jobs.length})
        </span>
        <button
          onClick={onAdd}
          className="size-7 grid place-items-center rounded-md hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Add job"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
            <Briefcase className="size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No jobs tracked yet.</p>
            <p className="text-[10px] text-muted-foreground/60">Browse live jobs or add one manually.</p>
          </div>
        )}
        {JOB_STATUSES.map((status) => {
          const items = grouped[status];
          if (!items || items.length === 0) return null;
          return (
            <div key={status}>
              <p className="px-2 mb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {statusLabel[status]} ({items.length})
              </p>
              <ul className="space-y-0.5">
                {items.map((job) => (
                  <li key={job.id}>
                    <button
                      onClick={() => onSelect(job.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md transition-colors group ${
                        activeId === job.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-border"
                          : "hover:bg-sidebar-accent/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-medium truncate leading-snug">{job.title}</p>
                      {job.company && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{job.company}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[job.status] ?? ""}`}>
                          {statusLabel[job.status] ?? job.status}
                        </span>
                        {job.platform && (
                          <span className="text-[9px] text-muted-foreground truncate">{job.platform}</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
