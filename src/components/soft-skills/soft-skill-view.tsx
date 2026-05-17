import { Mic, Handshake, Swords, Wifi, Terminal, GitPullRequest, RefreshCw, Clock, Sparkles, Brain } from "lucide-react";
import { SkillArea } from "@/components/tech-skills/skill-area";
import { SOFT_SKILLS_DATA } from "@/data/skills";

const COMMUNICATION_EXTRA_TABS = [
  { id: "speaking",    label: "Public Speaking", icon: Mic },
  { id: "negotiation", label: "Negotiation",     icon: Handshake },
];

const TEAMWORK_EXTRA_TABS = [
  { id: "conflict",  label: "Conflict Resolution",  icon: Swords },
  { id: "remote",    label: "Remote Collaboration",  icon: Wifi },
  { id: "pairing",   label: "Pair Programming",      icon: Terminal },
  { id: "codereview",label: "Code Review Culture",   icon: GitPullRequest },
  { id: "agile",     label: "Agile / Scrum",         icon: RefreshCw },
];

const LEADERSHIP_EXTRA_TABS = [
  { id: "time",           label: "Time Management", icon: Clock },
  { id: "growth",         label: "Growth Mindset",  icon: Sparkles },
  { id: "mental-models",  label: "Mental Models",   icon: Brain },
];

export function SoftSkillView({ activeTab }: { activeTab?: string }) {
  const subAreaTabs =
    activeTab === "communication" ? COMMUNICATION_EXTRA_TABS :
    activeTab === "teamwork"      ? TEAMWORK_EXTRA_TABS :
    activeTab === "leadership"    ? LEADERSHIP_EXTRA_TABS :
    [];

  return (
    <SkillArea
      data={SOFT_SKILLS_DATA}
      activeSubArea={activeTab}
      subAreaTabs={subAreaTabs}
    />
  );
}
