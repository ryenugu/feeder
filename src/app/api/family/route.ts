import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const family = await getCurrentFamily(supabase, user.id);

  if (!family) {
    return NextResponse.json({ family: null });
  }

  const { data: invites } = await supabase
    .from("family_invites")
    .select("*")
    .eq("family_id", family.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({ family, invites: invites || [] });
}
