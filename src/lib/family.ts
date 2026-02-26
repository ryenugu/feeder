import { SupabaseClient } from "@supabase/supabase-js";

export interface FamilyMember {
  id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  email?: string;
}

export interface Family {
  id: string;
  invite_code: string;
  created_at: string;
  members: FamilyMember[];
}

export interface FamilyInvite {
  id: string;
  family_id: string;
  invited_by: string;
  invite_email: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function getCurrentFamily(
  supabase: SupabaseClient,
  userId: string
): Promise<Family | null> {
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .single();

  if (!membership) return null;

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("id", membership.family_id)
    .single();

  if (!family) return null;

  const { data: members } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", family.id)
    .order("joined_at", { ascending: true });

  const enrichedMembers: FamilyMember[] = [];
  for (const m of members || []) {
    const { data: email } = await supabase.rpc("get_user_email", {
      target_user_id: m.user_id,
    });
    enrichedMembers.push({ ...m, email: email || "Unknown" });
  }

  return { ...family, members: enrichedMembers };
}
