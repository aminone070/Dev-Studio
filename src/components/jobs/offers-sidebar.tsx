import { Plus, Handshake } from "lucide-react";
import type { FreelanceOffer } from "./types";
import { STATUS_COLORS, PLATFORM_COLORS } from "./types";

interface Props {
  offers: FreelanceOffer[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

const statusLabel: Record<string, string> = {
  new: "New", in_review: "In Review", accepted: "Accepted", rejected: "Rejected", completed: "Done",
};

export function OffersSidebar({ offers, activeId, onSelect, onAdd }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Offers ({offers.length})
        </span>
        <button
          onClick={onAdd}
          className="size-7 grid place-items-center rounded-md hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground transition-colors"
          title="Add offer"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {offers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
            <Handshake className="size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No offers tracked yet.</p>
            <p className="text-[10px] text-muted-foreground/60">Add offers from Mostaql, Upwork, Fiverr, etc.</p>
          </div>
        )}
        <ul className="space-y-0.5">
          {offers.map((offer) => (
            <li key={offer.id}>
              <button
                onClick={() => onSelect(offer.id)}
                className={`w-full text-left px-2.5 py-2.5 rounded-md transition-colors group ${
                  activeId === offer.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-border"
                    : "hover:bg-sidebar-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <p className="text-xs font-medium truncate leading-snug">{offer.title}</p>
                {offer.client && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{offer.client}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {offer.platform && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${PLATFORM_COLORS[offer.platform] ?? "bg-muted text-muted-foreground"}`}>
                      {offer.platform}
                    </span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[offer.status] ?? ""}`}>
                    {statusLabel[offer.status] ?? offer.status}
                  </span>
                  {offer.budget && (
                    <span className="text-[9px] text-green-400 font-medium">{offer.budget} {offer.currency}</span>
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
