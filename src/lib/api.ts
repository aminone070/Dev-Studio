type LocalRecord = Record<string, unknown>;

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getCurrentUser() {
  try {
    const r = await fetch("/api/auth/user");
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function getProfile() {
  try {
    const r = await fetch("/api/profile");
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function updateProfile(profile: {
  displayName?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
}) {
  return apiFetch("/api/profile", { method: "POST", body: JSON.stringify(profile) });
}

export async function getPrompts(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/prompts"); } catch { return []; }
}
export async function upsertPrompt(p: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/prompts", { method: "POST", body: JSON.stringify(p) });
}
export async function upsertPrompts(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/prompts/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deletePrompt(id: string): Promise<void> {
  await apiFetch(`/api/prompts/${id}`, { method: "DELETE" });
}

export async function getAgents(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/agents"); } catch { return []; }
}
export async function upsertAgent(a: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/agents", { method: "POST", body: JSON.stringify(a) });
}
export async function upsertAgents(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/agents/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteAgent(id: string): Promise<void> {
  await apiFetch(`/api/agents/${id}`, { method: "DELETE" });
}

export async function getComponents(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/components"); } catch { return []; }
}
export async function upsertComponent(c: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/components", { method: "POST", body: JSON.stringify(c) });
}
export async function upsertComponents(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/components/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteComponent(id: string): Promise<void> {
  await apiFetch(`/api/components/${id}`, { method: "DELETE" });
}

export async function getSnippets(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/snippets"); } catch { return []; }
}
export async function upsertSnippet(s: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/snippets", { method: "POST", body: JSON.stringify(s) });
}
export async function upsertSnippets(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/snippets/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteSnippet(id: string): Promise<void> {
  await apiFetch(`/api/snippets/${id}`, { method: "DELETE" });
}

export async function getTemplates(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/templates"); } catch { return []; }
}
export async function upsertTemplate(t: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/templates", { method: "POST", body: JSON.stringify(t) });
}
export async function upsertTemplates(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/templates/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/api/templates/${id}`, { method: "DELETE" });
}

export async function getConnectors(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/connectors"); } catch { return []; }
}
export async function upsertConnector(c: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/connectors", { method: "POST", body: JSON.stringify(c) });
}
export async function upsertConnectors(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/connectors/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteConnector(id: string): Promise<void> {
  await apiFetch(`/api/connectors/${id}`, { method: "DELETE" });
}

export async function getSocialDrafts(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/social-drafts"); } catch { return []; }
}
export async function upsertSocialDraft(d: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/social-drafts", { method: "POST", body: JSON.stringify(d) });
}
export async function upsertSocialDrafts(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/social-drafts/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteSocialDraft(id: string): Promise<void> {
  await apiFetch(`/api/social-drafts/${id}`, { method: "DELETE" });
}

export async function getMailTemplates(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/mail-templates"); } catch { return []; }
}
export async function upsertMailTemplate(m: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/mail-templates", { method: "POST", body: JSON.stringify(m) });
}
export async function upsertMailTemplates(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/mail-templates/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteMailTemplate(id: string): Promise<void> {
  await apiFetch(`/api/mail-templates/${id}`, { method: "DELETE" });
}

export async function getInterviewQuestions(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/interview-questions"); } catch { return []; }
}
export async function upsertInterviewQuestion(q: LocalRecord): Promise<LocalRecord> {
  return apiFetch("/api/interview-questions", { method: "POST", body: JSON.stringify(q) });
}
export async function upsertInterviewQuestions(items: LocalRecord[]): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/interview-questions/bulk", { method: "POST", body: JSON.stringify(items) }); } catch { return items; }
}
export async function deleteInterviewQuestion(id: string): Promise<void> {
  await apiFetch(`/api/interview-questions/${id}`, { method: "DELETE" });
}

export async function getUserProgress(): Promise<LocalRecord[]> {
  try { return await apiFetch("/api/progress"); } catch { return []; }
}
export async function toggleProgress(itemId: string, areaId: string, completed: boolean): Promise<void> {
  await apiFetch("/api/progress/toggle", {
    method: "POST",
    body: JSON.stringify({ itemId, areaId, completed }),
  });
}
