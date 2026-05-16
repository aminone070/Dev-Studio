import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/ui-store";

interface SplitLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: string;
  className?: string;
}

export function SplitLayout({
  sidebar,
  children,
  sidebarWidth = "w-64",
  className = "",
}: SplitLayoutProps) {
  const { sidebarOpen: isOpen, toggleSidebar } = useUIStore();

  const sidebarWidthClass = React.useMemo(() => {
    const hasBaseWidth =
      /(^|\s)w-([^\d]|\[)/.test(sidebarWidth) || /(^|\s)w-\d+/.test(sidebarWidth);
    if (!hasBaseWidth) return `w-72 ${sidebarWidth}`;
    return sidebarWidth;
  }, [sidebarWidth]);

  const widthValue = React.useMemo(() => {
    const bracketMatch = sidebarWidthClass.match(/\[(.*?)\]/);
    let baseWidth = "288px";
    if (bracketMatch) baseWidth = bracketMatch[1];
    else if (sidebarWidthClass.includes("w-80")) baseWidth = "320px";
    else if (sidebarWidthClass.includes("w-72")) baseWidth = "288px";
    else if (sidebarWidthClass.includes("w-64")) baseWidth = "256px";
    else if (sidebarWidthClass.includes("w-60")) baseWidth = "240px";
    return `min(${baseWidth}, 70vw)`;
  }, [sidebarWidthClass]);

  return (
    <div
      className={cn("flex h-full min-h-0 bg-background relative overflow-hidden", className)}
      style={{ "--sidebar-width": widthValue } as React.CSSProperties}
    >
      {/* Inner sidebar panel */}
      <aside
        className={cn(
          "flex flex-col shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden relative p-2 pr-0",
          !isOpen && "w-0 p-0",
        )}
        style={{ width: isOpen ? "calc(var(--sidebar-width) + 8px)" : "0" }}
      >
        <div
          className={cn(
            "flex-1 flex flex-col transition-opacity duration-200 overflow-hidden relative group/sidebar rounded-2xl border border-border/60 bg-muted/20",
            isOpen ? "opacity-100 delay-150" : "opacity-0 pointer-events-none",
          )}
          style={{ width: "var(--sidebar-width)" }}
        >
          {sidebar}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/20 to-transparent pointer-events-none z-10 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
        </div>
      </aside>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "grid place-items-center absolute top-16 z-30 size-5 rounded-full border border-border/60 bg-background shadow-sm hover:bg-muted/60 hover:scale-110 active:scale-95 transition-all duration-200 group",
          isOpen ? "left-[calc(var(--sidebar-width))]" : "left-2",
        )}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronLeft className="size-3 text-muted-foreground group-hover:text-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground" />
        )}
      </button>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">{children}</main>
    </div>
  );
}
