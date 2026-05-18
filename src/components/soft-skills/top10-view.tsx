import { useState, useEffect, useRef } from "react";
import {
  Trophy, Plus, Trash2, Edit3, Check, X, Search,
  ChevronDown, ChevronUp, Lightbulb, Sparkles, BookOpen,
  MessageCircle, AlertCircle, Clock, DollarSign, Users,
  Target, Star, Layers, MoreHorizontal,
} from "lucide-react";
import { SplitLayout } from "@/components/layout";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────── */

interface Scenario {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  createdAt: number;
}

interface Question {
  id: string;
  title: string;
  guide: string;
  scenarios: Scenario[];
  isDefault?: boolean;
}

/* ─── Default Questions ──────────────────────────────────────── */

const DEFAULT_QUESTIONS: Omit<Question, "scenarios">[] = [
  {
    id: "q-tell-yourself", isDefault: true,
    title: "Tell Me About Yourself",
    guide: "Use the Present → Past → Future formula. Present: your current role and what you deliver. Past: the experience that made you effective at it. Future: why this role is the next logical step. Keep it under 2 minutes. Never start with your university — start with your value.",
  },
  {
    id: "q-strength", isDefault: true,
    title: "What Is Your Greatest Strength?",
    guide: "Pick ONE specific strength. Back it with a concrete example (STAR: Situation, Task, Action, Result). Connect it directly to the role you're interviewing for. 'I'm a hard worker' is a red flag — 'I debug complex distributed systems quickly' is a strength.",
  },
  {
    id: "q-weakness", isDefault: true,
    title: "What Is Your Greatest Weakness?",
    guide: "Avoid fake weaknesses ('I work too hard'). Pick a real one that you're actively improving. Framework: name the weakness → show self-awareness → show what you've done to address it → show evidence of improvement.",
  },
  {
    id: "q-why-here", isDefault: true,
    title: "Why Do You Want to Work Here?",
    guide: "This tests whether you researched the company. Answer requires: (1) something specific about their product/mission/culture that genuinely excites you, (2) how your skills connect to their current challenges, (3) what you want to learn or build there.",
  },
  {
    id: "q-5-years", isDefault: true,
    title: "Where Do You See Yourself in 5 Years?",
    guide: "They're asking: will you leave in 6 months, and do you have ambition? Show growth ambition within the domain. 'I want to go deeper in distributed systems and eventually lead architecture decisions for high-scale products' is strong.",
  },
  {
    id: "q-time", isDefault: true,
    title: "How Do You Manage Your Time & Priorities?",
    guide: "Walk them through your actual system — not a textbook answer. Mention: how you prioritise competing tasks (impact vs effort), how you handle interruptions, how you communicate when timelines shift. Use a real example.",
  },
  {
    id: "q-salary", isDefault: true,
    title: "What Are Your Salary Expectations?",
    guide: "Do market research first (Glassdoor, Levels.fyi, LinkedIn Salary). Give a range anchored at the high end of reasonable. Don't give a single number — it anchors too low. Don't say 'whatever is fair' — it signals no self-worth.",
  },
  {
    id: "q-conflict", isDefault: true,
    title: "How Do You Handle Conflict or Pressure?",
    guide: "Use a real story. STAR method: the conflict (Situation), your role (Task), what you actually did (Action), the outcome (Result). Show that you addressed the issue directly, kept the relationship intact, and focused on the problem not the person.",
  },
  {
    id: "q-challenge", isDefault: true,
    title: "Tell Me About a Challenge You Overcame",
    guide: "STAR method is non-negotiable here. Pick a challenge that was genuinely hard. The Action phase is the longest: break down exactly what YOU did. The Result must be measurable or at least concrete. Common mistake: 80% on situation, 20% on action — flip it.",
  },
  {
    id: "q-questions", isDefault: true,
    title: "Do You Have Any Questions for Us?",
    guide: "Always have 3 prepared. Never say 'no, I think you covered everything.' Good questions: 'What does success look like in the first 90 days?', 'What's the biggest technical challenge the team faces?', 'How do you handle disagreements on technical direction?'",
  },
];

const SUGGESTED_QUESTIONS = [
  { id: "s-fail",      title: "Tell Me About a Time You Failed",          guide: "Own the failure completely — no excuses, no blame-shifting. Show self-awareness, what you learned, and most importantly, what changed afterward. The bigger the failure you can own, the more credible your growth story." },
  { id: "s-feedback",  title: "How Do You Handle Feedback?",               guide: "Demonstrate that you actively seek feedback, not just receive it. Use a specific example: someone gave you hard feedback → you implemented it → measurable improvement resulted. 'I welcome feedback' with no example is worthless." },
  { id: "s-disagree",  title: "Tell Me About a Time You Disagreed With Your Manager", guide: "This tests: do you have a backbone, and can you disagree professionally? Answer structure: what was the disagreement → how you raised it (data, private conversation) → what happened → what you learned. No complaining." },
  { id: "s-motivate",  title: "What Motivates You?",                       guide: "Connect your answer to the actual work in the role. 'Money' is honest but weak alone. 'I'm most alive when debugging a gnarly system issue and finding the root cause' shows self-awareness and role alignment." },
  { id: "s-pressure",  title: "How Do You Prioritize When Everything Is Urgent?", guide: "Show a real framework: impact vs effort, business criticality, deadline dependency. Then give an example where you applied it. Bonus: mention how you communicate reprioritization to stakeholders." },
  { id: "s-lead",      title: "Tell Me About a Time You Led a Project",    guide: "Even if you're not a manager — you've led initiatives. Focus: how you defined scope, aligned people, unblocked issues, and delivered. Leadership is influence, not title." },
  { id: "s-ambiguous", title: "How Do You Work With Ambiguity?",           guide: "Senior engineers love this question because ambiguity is the norm. Show: you identify what you know vs don't know, ask the right questions to reduce it, make a reversible decision and move, then adjust. Don't say 'I ask my manager.'" },
  { id: "s-learning",  title: "How Do You Stay Current With Technology?",  guide: "Be specific: newsletters you actually read, open-source you contribute to, projects you've built to experiment. 'I read tech blogs' is too vague. Give one concrete example from the last 3 months." },
];

/* ─── Storage Hook ───────────────────────────────────────────── */

const STORAGE_KEY = "ds_top10_questions_v1";

function seed(): Question[] {
  return DEFAULT_QUESTIONS.map((q) => ({ ...q, scenarios: [] }));
}

function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Question[];
    } catch {}
    return seed();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  const addQuestion = (title: string, guide: string) => {
    const q: Question = {
      id: `q-${Date.now()}`,
      title: title.trim(),
      guide: guide.trim(),
      scenarios: [],
    };
    setQuestions((prev) => [...prev, q]);
    return q.id;
  };

  const removeQuestion = (id: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== id));

  const updateQuestion = (id: string, patch: Partial<Pick<Question, "title" | "guide">>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const addScenario = (qid: string, s: Omit<Scenario, "id" | "createdAt">) => {
    const scenario: Scenario = { ...s, id: `sc-${Date.now()}`, createdAt: Date.now() };
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, scenarios: [...q.scenarios, scenario] } : q)),
    );
  };

  const updateScenario = (qid: string, sid: string, patch: Partial<Omit<Scenario, "id" | "createdAt">>) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, scenarios: q.scenarios.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }
          : q,
      ),
    );

  const removeScenario = (qid: string, sid: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid ? { ...q, scenarios: q.scenarios.filter((s) => s.id !== sid) } : q,
      ),
    );

  const addSuggested = (s: (typeof SUGGESTED_QUESTIONS)[number]) => {
    if (questions.some((q) => q.id === s.id)) return s.id;
    const q: Question = { id: s.id, title: s.title, guide: s.guide, scenarios: [] };
    setQuestions((prev) => [...prev, q]);
    return s.id;
  };

  return { questions, addQuestion, removeQuestion, updateQuestion, addScenario, updateScenario, removeScenario, addSuggested };
}

/* ─── Scenario Form ──────────────────────────────────────────── */

interface ScenarioFormProps {
  initial?: Partial<Scenario>;
  onSave: (data: Omit<Scenario, "id" | "createdAt">) => void;
  onCancel: () => void;
}

function ScenarioForm({ initial, onSave, onCancel }: ScenarioFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    situation: initial?.situation ?? "",
    task: initial?.task ?? "",
    action: initial?.action ?? "",
    result: initial?.result ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = form.title.trim().length > 0 && form.action.trim().length > 0;

  const FIELDS: { key: keyof typeof form; label: string; abbr: string; placeholder: string; color: string }[] = [
    { key: "situation", abbr: "S", label: "Situation",  color: "text-blue-400",   placeholder: "What was the context? Set the scene briefly." },
    { key: "task",      abbr: "T", label: "Task",       color: "text-amber-400",  placeholder: "What was your responsibility or goal?" },
    { key: "action",    abbr: "A", label: "Action",     color: "text-primary",    placeholder: "What exactly did YOU do? Be specific — this is the most important part." },
    { key: "result",    abbr: "R", label: "Result",     color: "text-emerald-400",placeholder: "What was the measurable or concrete outcome?" },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">
          Scenario Title
        </label>
        <input
          autoFocus
          value={form.title}
          onChange={set("title")}
          placeholder="e.g., Led migration to microservices at Acme Co."
          className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
      </div>
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1">
            <span className={cn("font-bold", f.color)}>{f.abbr}</span>
            <span className="text-muted-foreground">{f.label}</span>
          </label>
          <textarea
            rows={2}
            value={form[f.key]}
            onChange={set(f.key)}
            placeholder={f.placeholder}
            className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 resize-none transition-all"
          />
        </div>
      ))}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all">
          <X className="size-3" /> Cancel
        </button>
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
            valid ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          <Check className="size-3" /> Save Scenario
        </button>
      </div>
    </div>
  );
}

/* ─── Scenario Card ──────────────────────────────────────────── */

function ScenarioCard({
  scenario, onEdit, onDelete,
}: { scenario: Scenario; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const ROWS: { abbr: string; label: string; value: string; color: string }[] = [
    { abbr: "S", label: "Situation", value: scenario.situation, color: "text-blue-400" },
    { abbr: "T", label: "Task",      value: scenario.task,      color: "text-amber-400" },
    { abbr: "A", label: "Action",    value: scenario.action,    color: "text-primary" },
    { abbr: "R", label: "Result",    value: scenario.result,    color: "text-emerald-400" },
  ].filter((r) => r.value.trim());

  return (
    <div className="rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between gap-2 p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="size-7 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0 mt-0.5">
            <Star className="size-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug truncate">{scenario.title}</p>
            {!expanded && scenario.action && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{scenario.action}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all" title="Edit">
            <Edit3 className="size-3" />
          </button>
          <button onClick={onDelete} className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all" title="Delete">
            <Trash2 className="size-3" />
          </button>
          <button onClick={() => setExpanded((e) => !e)} className="size-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all">
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
          {ROWS.map((r) => (
            <div key={r.abbr}>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1">
                <span className={cn("font-bold", r.color)}>{r.abbr}</span>
                <span className="text-muted-foreground">{r.label}</span>
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Add Question Form ──────────────────────────────────────── */

function AddQuestionForm({ onSave, onCancel }: { onSave: (title: string, guide: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [guide, setGuide] = useState("");
  return (
    <div className="p-3 border-b border-border/60 space-y-2 bg-muted/20">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Question title…"
        className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
      />
      <textarea
        rows={2}
        value={guide}
        onChange={(e) => setGuide(e.target.value)}
        placeholder="Answer guide / tips (optional)"
        className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 resize-none transition-all"
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => title.trim() && onSave(title, guide)}
          disabled={!title.trim()}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-xs font-medium transition-all",
            title.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          Add Question
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:bg-muted/60 transition-all">
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main View ──────────────────────────────────────────────── */

export function Top10QuestionsView() {
  const { questions, addQuestion, removeQuestion, updateQuestion, addScenario, updateScenario, removeScenario, addSuggested } = useQuestions();

  const [activeId, setActiveId]           = useState<string>(questions[0]?.id ?? "");
  const [search, setSearch]               = useState("");
  const [showAddQ, setShowAddQ]           = useState(false);
  const [editingTitle, setEditingTitle]   = useState(false);
  const [titleDraft, setTitleDraft]       = useState("");
  const [editingGuide, setEditingGuide]   = useState(false);
  const [guideDraft, setGuideDraft]       = useState("");
  const [guideOpen, setGuideOpen]         = useState(true);
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [confirmDeleteQ, setConfirmDeleteQ] = useState<string | null>(null);
  const [confirmDeleteS, setConfirmDeleteS] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const active = questions.find((q) => q.id === activeId) ?? questions[0] ?? null;

  useEffect(() => {
    if (!active && questions.length > 0) setActiveId(questions[0].id);
  }, [questions]);

  const filtered = questions.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));
  const addedIds = new Set(questions.map((q) => q.id));
  const suggestions = SUGGESTED_QUESTIONS.filter((s) => !addedIds.has(s.id));

  /* title inline edit */
  const startEditTitle = () => {
    if (!active) return;
    setTitleDraft(active.title);
    setEditingTitle(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };
  const saveTitle = () => {
    if (active && titleDraft.trim()) updateQuestion(active.id, { title: titleDraft.trim() });
    setEditingTitle(false);
  };

  /* guide inline edit */
  const startEditGuide = () => {
    if (!active) return;
    setGuideDraft(active.guide);
    setEditingGuide(true);
  };
  const saveGuide = () => {
    if (active) updateQuestion(active.id, { guide: guideDraft });
    setEditingGuide(false);
  };

  /* delete question with confirmation */
  const handleDeleteQ = (id: string) => {
    const q = questions.find((x) => x.id === id);
    if (!q) return;
    if (q.scenarios.length === 0 && confirmDeleteQ !== id) {
      removeQuestion(id);
      if (activeId === id) setActiveId(questions.find((x) => x.id !== id)?.id ?? "");
      return;
    }
    if (confirmDeleteQ === id) {
      removeQuestion(id);
      if (activeId === id) setActiveId(questions.find((x) => x.id !== id)?.id ?? "");
      setConfirmDeleteQ(null);
    } else {
      setConfirmDeleteQ(id);
    }
  };

  /* ── Sidebar ──────────────────────────────────────────────── */
  const sidebar = (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-3 py-3 border-b border-border/60 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0">
            <Trophy className="size-3.5" />
          </div>
          <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 truncate">
            Questions
          </span>
          <button
            onClick={() => { setShowAddQ((v) => !v); setConfirmDeleteQ(null); }}
            title="Add Question"
            className="size-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            {showAddQ ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted/40 border border-border/60 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
        </div>
      </div>

      {showAddQ && (
        <AddQuestionForm
          onSave={(t, g) => {
            const id = addQuestion(t, g);
            setActiveId(id);
            setShowAddQ(false);
          }}
          onCancel={() => setShowAddQ(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-3">
        {/* My Questions */}
        <div>
          <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
            My Questions
            <span className="ml-1 text-muted-foreground/40">({filtered.length})</span>
          </p>
          <nav className="space-y-0.5">
            {filtered.map((q) => {
              const isActive  = activeId === q.id;
              const isConfirm = confirmDeleteQ === q.id;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "group flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  onClick={() => { setActiveId(q.id); setConfirmDeleteQ(null); setShowAddScenario(false); setEditingScenarioId(null); }}
                >
                  <span className={cn("flex-1 truncate", isActive ? "text-foreground" : "")}>{q.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {q.scenarios.length > 0 && (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums",
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/60",
                      )}>
                        {q.scenarios.length}
                      </span>
                    )}
                    {isConfirm ? (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDeleteQ(q.id)} className="size-5 rounded flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all" title="Confirm delete">
                          <Check className="size-2.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteQ(null)} className="size-5 rounded flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-all">
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQ(q.id); }}
                        className="size-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete question"
                      >
                        <Trash2 className="size-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[10px] text-center text-muted-foreground py-4 italic">No questions match</p>
            )}
          </nav>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="px-3 pt-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Suggestions
            </p>
            <nav className="space-y-0.5">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const id = addSuggested(s);
                    setActiveId(id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground/60 hover:bg-muted/40 hover:text-muted-foreground transition-all group"
                >
                  <Plus className="size-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="truncate text-left">{s.title}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Main content ─────────────────────────────────────────── */
  return (
    <SplitLayout sidebar={sidebar} sidebarWidth="lg:w-[260px]">
      <div className="h-full flex flex-col overflow-hidden">

        {!active ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="size-12 rounded-2xl bg-primary/10 grid place-items-center text-primary mx-auto">
                <Trophy className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No questions yet</p>
              <p className="text-xs text-muted-foreground">Add a question or pick one from the suggestions.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-xl bg-primary/10 grid place-items-center text-primary shrink-0 mt-0.5">
                  <MessageCircle className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={titleRef}
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                        className="flex-1 bg-muted/40 border border-primary/40 rounded-xl px-3 py-1.5 text-sm font-semibold outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                      <button onClick={saveTitle} className="size-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all">
                        <Check className="size-3.5" />
                      </button>
                      <button onClick={() => setEditingTitle(false)} className="size-7 rounded-lg text-muted-foreground hover:bg-muted/60 flex items-center justify-center transition-all">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <h2 className="text-base font-bold text-foreground leading-snug flex-1">{active.title}</h2>
                      <button onClick={startEditTitle} className="size-6 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60 transition-all shrink-0 mt-0.5" title="Edit title">
                        <Edit3 className="size-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {active.scenarios.length === 0 ? "No scenarios prepared yet" : `${active.scenarios.length} scenario${active.scenarios.length !== 1 ? "s" : ""} prepared`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-5 space-y-6 max-w-3xl mx-auto">

                {/* Answer Guide */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setGuideOpen((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setGuideOpen((v) => !v)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="size-6 rounded-lg bg-amber-500/10 grid place-items-center text-amber-500 shrink-0">
                      <Lightbulb className="size-3.5" />
                    </div>
                    <span className="flex-1 text-left text-xs font-semibold text-foreground">Answer Guide</span>
                    <div className="flex items-center gap-1">
                      {!editingGuide && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditGuide(); setGuideOpen(true); }}
                          className="size-5 rounded flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-all"
                          title="Edit guide"
                        >
                          <Edit3 className="size-3" />
                        </button>
                      )}
                      {guideOpen ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {guideOpen && (
                    <div className="px-4 pb-4">
                      {editingGuide ? (
                        <div className="space-y-2">
                          <textarea
                            autoFocus
                            rows={5}
                            value={guideDraft}
                            onChange={(e) => setGuideDraft(e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 resize-none transition-all"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingGuide(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:bg-muted/60 transition-all">
                              <X className="size-3" /> Cancel
                            </button>
                            <button onClick={saveGuide} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                              <Check className="size-3" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">{active.guide || <em className="text-muted-foreground/40">No guide written yet. Click the pencil to add one.</em>}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Scenarios Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                        <Layers className="size-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">My Scenarios</span>
                      {active.scenarios.length > 0 && (
                        <span className="text-xs text-muted-foreground">· {active.scenarios.length}</span>
                      )}
                    </div>
                    {!showAddScenario && (
                      <button
                        onClick={() => { setShowAddScenario(true); setEditingScenarioId(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      >
                        <Plus className="size-3" /> Add Scenario
                      </button>
                    )}
                  </div>

                  {/* STAR hint */}
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-muted/30 border border-border/40">
                    <Sparkles className="size-3 text-primary/60 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      Scenarios use the <span className="font-semibold text-foreground">STAR</span> format —{" "}
                      <span className="text-blue-400 font-medium">Situation</span>,{" "}
                      <span className="text-amber-400 font-medium">Task</span>,{" "}
                      <span className="text-primary font-medium">Action</span>,{" "}
                      <span className="text-emerald-400 font-medium">Result</span>.
                      Prepare 2–3 per question for flexibility.
                    </p>
                  </div>

                  {/* Add Scenario Form */}
                  {showAddScenario && (
                    <div className="mb-4">
                      <ScenarioForm
                        onSave={(data) => {
                          addScenario(active.id, data);
                          setShowAddScenario(false);
                        }}
                        onCancel={() => setShowAddScenario(false)}
                      />
                    </div>
                  )}

                  {/* Scenario List */}
                  <div className="space-y-3">
                    {active.scenarios.map((sc) =>
                      editingScenarioId === sc.id ? (
                        <div key={sc.id}>
                          <ScenarioForm
                            initial={sc}
                            onSave={(data) => {
                              updateScenario(active.id, sc.id, data);
                              setEditingScenarioId(null);
                            }}
                            onCancel={() => setEditingScenarioId(null)}
                          />
                        </div>
                      ) : confirmDeleteS === sc.id ? (
                        <div key={sc.id} className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
                          <AlertCircle className="size-4 text-red-400 shrink-0" />
                          <p className="flex-1 text-xs text-muted-foreground">Delete <span className="font-semibold text-foreground">"{sc.title}"</span>?</p>
                          <button onClick={() => { removeScenario(active.id, sc.id); setConfirmDeleteS(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                            <Trash2 className="size-3" /> Delete
                          </button>
                          <button onClick={() => setConfirmDeleteS(null)} className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:bg-muted/60 transition-all">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <ScenarioCard
                          key={sc.id}
                          scenario={sc}
                          onEdit={() => { setEditingScenarioId(sc.id); setShowAddScenario(false); }}
                          onDelete={() => setConfirmDeleteS(sc.id)}
                        />
                      ),
                    )}
                  </div>

                  {/* Empty state */}
                  {active.scenarios.length === 0 && !showAddScenario && (
                    <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl">
                      <div className="size-10 rounded-2xl bg-muted/60 grid place-items-center mx-auto mb-3">
                        <Star className="size-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No scenarios yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Prepare real stories from your experience using the STAR format.</p>
                      <button
                        onClick={() => setShowAddScenario(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                      >
                        <Plus className="size-3" /> Add Your First Scenario
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </SplitLayout>
  );
}
