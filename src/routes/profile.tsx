import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, PageContainer } from "@/components/layout";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Dev Studio" }] }),
  component: ProfilePage,
});

interface UserProfile {
  displayName: string | null;
  avatarUrl: string | null;
  location: string | null;
}

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ displayName: "", avatarUrl: "", location: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setProfile({
            displayName: data.displayName ?? "",
            avatarUrl: data.avatarUrl ?? "",
            location: data.location ?? "",
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = profile.avatarUrl || null;
  const displayedName = profile.displayName || user?.name;

  return (
    <PageContainer className="overflow-y-auto">
      <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-border bg-background">
        <div className="max-w-[1400px] mx-auto">
          <PageHeader
            eyebrow="Account"
            title="Profile"
            description="Your Dev Studio profile and account settings."
            className="mb-8"
          />
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-[600px] mx-auto space-y-6">

          {/* Avatar & name preview */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex items-center gap-4">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayedName ?? ""}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-gradient-to-br from-primary to-accent grid place-items-center text-lg font-semibold text-primary-foreground">
                {(displayedName ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{displayedName ?? "—"}</p>
              {profile.location && (
                <p className="text-sm text-muted-foreground">{profile.location}</p>
              )}
              {!profile.location && user?.name && (
                <p className="text-sm text-muted-foreground">@{user.name}</p>
              )}
            </div>
          </div>

          {/* Editable fields */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold tracking-tight">Edit Profile</h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Display name
              </label>
              <p className="text-[10px] text-muted-foreground mb-1">Your public name</p>
              <input
                type="text"
                value={profile.displayName ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                placeholder={user?.name ?? "Enter display name…"}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Avatar URL
              </label>
              <input
                type="url"
                value={profile.avatarUrl ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, avatarUrl: e.target.value }))}
                placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                value={profile.location ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                placeholder="City, Country"
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Authentication is managed through your Replit account.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
