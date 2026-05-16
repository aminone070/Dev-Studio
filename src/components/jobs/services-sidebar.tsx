import { Plus, Star } from "lucide-react";
import type { MyService } from "./types";
import { STATUS_COLORS, PLATFORM_COLORS } from "./types";

interface Props {
  services: MyService[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Active", paused: "Paused", draft: "Draft",
};

export function ServicesSidebar({ services, activeId, onSelect, onAdd }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Services ({services.length})
        </span>
        <button
          onClick={onAdd}
          className="size-7 grid place-items-center rounded-md hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Add service"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
            <Star className="size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No services listed yet.</p>
            <p className="text-[10px] text-muted-foreground/60">Add your Fiverr, Mostaql, or Khamsat gigs.</p>
          </div>
        )}
        <ul className="space-y-0.5">
          {services.map((svc) => (
            <li key={svc.id}>
              <button
                onClick={() => onSelect(svc.id)}
                className={`w-full text-left px-2.5 py-2.5 rounded-md transition-colors group ${
                  activeId === svc.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-border"
                    : "hover:bg-sidebar-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <p className="text-xs font-medium truncate leading-snug">{svc.title}</p>
                {svc.category && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{svc.category}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {svc.platform && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${PLATFORM_COLORS[svc.platform] ?? "bg-muted text-muted-foreground"}`}>
                      {svc.platform}
                    </span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[svc.status] ?? ""}`}>
                    {statusLabel[svc.status] ?? svc.status}
                  </span>
                  {svc.price && (
                    <span className="text-[9px] text-green-400 font-medium">{svc.price} {svc.currency}</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
