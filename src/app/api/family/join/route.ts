import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getCurrentFamily(supabase, user.id);
  if (existing) {
    return NextResponse.json(
      { error: "You are already in a family. Leave your current family first." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const code = (body.code || "").toUpperCase().trim();

  if (!code) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("*")
    .eq("invite_code", code)
    .single();

  if (familyError || !family) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 }
    );
  }

  const { data: existingMembers } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", family.id);

  if (existingMembers && existingMembers.length >= 2) {
    return NextResponse.json(
      { error: "This family already has 2 members" },
      { status: 400 }
    );
  }

  const { error: joinError } = await supabase.from("family_members").insert({
    family_id: family.id,
    user_id: user.id,
    role: "member",
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  // Mark any pending invites for this email as accepted
  await supabase
    .from("family_invites")
    .update({ status: "accepted" })
    .eq("family_id", family.id)
    .eq("invite_email", user.email || "")
    .eq("status", "pending");

  const updatedFamily = await getCurrentFamily(supabase, user.id);

  return NextResponse.json({ family: updatedFamily });
}
