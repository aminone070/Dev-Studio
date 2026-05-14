import { Link } from "@tanstack/react-router";
import { LucideIcon } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  to?: string;
  search?: Record<string, any>;
  onClick?: () => void;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  className?: string;
}

export function TabNav({ tabs, activeTab, className = "" }: TabNavProps) {
  return (
    <div className={`w-full overflow-x-auto pb-2 -mb-2 ${className}`}>
      {/* 
        This structure guarantees:
        1. On large screens: perfectly centered.
        2. On small screens: scrolls from left to right.
        3. Never clips edges because we use real DOM spacers instead of padding.
      */}
      <div className="flex w-max min-w-full sm:justify-center">
        {/* Left spacer */}
        <div className="w-1 shrink-0 sm:hidden" />
        
        <nav
          className="flex shrink-0 items-center gap-1.5 p-1 bg-muted/30 border border-border rounded-lg"
          aria-label="Tabs"
        >
          <div className="flex items-center gap-1.5 px-0.5">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;

            const content = (
              <>
                {Icon && (
                  <Icon
                    className={`size-3.5 transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </>
            );

            const baseClass = `group flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-all rounded-md border whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent focus-visible:border-border"
            }`;

            if (tab.to) {
              return (
                <Link key={tab.id} to={tab.to} search={tab.search} className={baseClass}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={tab.id} onClick={tab.onClick} className={baseClass}>
                {content}
              </button>
            );
          })}
          </div>
        </nav>
        
        {/* Right spacer */}
        <div className="w-4 shrink-0 sm:hidden" />
      </div>
    </div>
  );
}
