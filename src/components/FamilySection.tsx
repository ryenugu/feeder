"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/Toast";

interface FamilyMember {
  id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  email?: string;
}

interface Family {
  id: string;
  invite_code: string;
  created_at: string;
  members: FamilyMember[];
}

interface FamilyInvite {
  id: string;
  invite_email: string;
  status: string;
  created_at: string;
}

export default function FamilySection({ currentUserEmail }: { currentUserEmail: string | null }) {
  const [family, setFamily] = useState<Family | null>(null);
  const [invites, setInvites] = useState<FamilyInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFamily, setShowFamily] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadFamily = useCallback(async () => {
    try {
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setFamily(data.family);
        setInvites(data.invites || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/family/create", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || "Failed to create family" });
        return;
      }
      showToast({ message: "Family created!" });
      await loadFamily();
    } catch {
      showToast({ message: "Failed to create family" });
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || "Failed to join family" });
        return;
      }
      showToast({ message: "Joined family!" });
      setJoinCode("");
      await loadFamily();
    } catch {
      showToast({ message: "Failed to join family" });
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    try {
      const res = await fetch("/api/family/leave", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast({ message: data.error || "Failed to leave family" });
        return;
      }
      showToast({ message: "Left family" });
      setFamily(null);
      setInvites([]);
      setConfirmLeave(false);
    } catch {
      showToast({ message: "Failed to leave family" });
    }
  }

  async function handleRemove(userId: string) {
    try {
      const res = await fetch(`/api/family/remove?user_id=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast({ message: data.error || "Failed to remove member" });
        return;
      }
      showToast({ message: "Member removed" });
      setConfirmRemove(null);
      await loadFamily();
    } catch {
      showToast({ message: "Failed to remove member" });
    }
  }

  async function handleCopyCode() {
    if (!family) return;
    try {
      await navigator.clipboard.writeText(family.invite_code);
      showToast({ message: "Invite code copied!" });
    } catch {
      showToast({ message: `Code: ${family.invite_code}` });
    }
  }

  const myMember = family?.members.find(
    (m) => m.email === currentUserEmail
  );
  const isOwner = myMember?.role === "owner";
  const partner = family?.members.find(
    (m) => m.email !== currentUserEmail
  );

  function getInitial(email?: string) {
    return (email || "?")[0].toUpperCase();
  }

  return (
    <div className="mb-4 rounded-2xl bg-card p-5 shadow-sm">
      <button
        onClick={() => setShowFamily(!showFamily)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Family</h2>
          {family && (
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium text-primary">
              {family.members.length}/4
            </span>
          )}
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted transition-transform ${showFamily ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showFamily && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <p className="text-xs text-muted">Loading...</p>
          ) : !family ? (
            /* No family — show create/join */
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Link with a family member to share recipes, meal plans, and shopping lists.
              </p>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Family"}
              </button>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  maxLength={6}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono tracking-widest placeholder:text-muted placeholder:tracking-normal placeholder:font-sans focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim()}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {joining ? "..." : "Join"}
                </button>
              </div>
            </div>
          ) : (
            /* Has family */
            <div className="space-y-3">
              {/* Members list */}
              <div className="space-y-2">
                {family.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl bg-background p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {getInitial(m.email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.email}
                        {m.email === currentUserEmail && (
                          <span className="ml-1 text-xs text-muted">(you)</span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted capitalize">{m.role}</p>
                    </div>
                    {isOwner && m.email !== currentUserEmail && (
                      <>
                        {confirmRemove === m.user_id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRemove(m.user_id)}
                              className="rounded-lg bg-error px-2 py-1 text-[11px] font-medium text-white"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="rounded-lg bg-background px-2 py-1 text-[11px] font-medium text-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemove(m.user_id)}
                            className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-error-light hover:text-error"
                            aria-label="Remove member"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <line x1="17" y1="11" x2="22" y2="11" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite code */}
              {family.members.length < 4 && (
                <div className="rounded-xl bg-primary-light/50 p-3">
                  <p className="mb-1.5 text-xs font-semibold text-primary">
                    Invite Code
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg font-bold tracking-[0.3em] text-primary">
                      {family.invite_code}
                    </p>
                    <button
                      onClick={handleCopyCode}
                      className="rounded-lg bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary hover:text-white"
                      aria-label="Copy invite code"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    Share this code with your family member so they can join.
                  </p>
                </div>
              )}

              {/* Pending invites */}
              {invites.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted">Pending Invites</p>
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-2 rounded-xl bg-background p-2.5 text-xs"
                    >
                      <span className="text-muted">Invited:</span>
                      <span className="font-medium">{inv.invite_email}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Leave button */}
              <div className="pt-1">
                {confirmLeave ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleLeave}
                      className="flex-1 rounded-xl bg-error py-2 text-sm font-medium text-white"
                    >
                      {isOwner && family.members.length === 1
                        ? "Dissolve Family"
                        : "Confirm Leave"}
                    </button>
                    <button
                      onClick={() => setConfirmLeave(false)}
                      className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="w-full rounded-xl border border-error/20 bg-error-light py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
                  >
                    {isOwner && family.members.length === 1
                      ? "Dissolve Family"
                      : "Leave Family"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
