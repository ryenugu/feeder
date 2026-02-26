import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInviteCode, getCurrentFamily } from "@/lib/family";
import crypto from "crypto";

export async function POST() {
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
      { error: "You are already in a family" },
      { status: 400 }
    );
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: conflict } = await supabase
      .from("families")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();
    if (!conflict) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  // Generate UUID upfront so we can reference it in both inserts
  // without needing .select() (which RLS blocks before we're a member).
  const familyId = crypto.randomUUID();

  const { error: familyError } = await supabase
    .from("families")
    .insert({ id: familyId, invite_code: inviteCode });

  if (familyError) {
    return NextResponse.json(
      { error: familyError.message },
      { status: 500 }
    );
  }

  const { error: memberError } = await supabase.from("family_members").insert({
    family_id: familyId,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    await supabase.from("families").delete().eq("id", familyId);
    return NextResponse.json(
      { error: memberError.message },
      { status: 500 }
    );
  }

  // Now that we're in family_members, RLS lets us read the family back.
  const family = await getCurrentFamily(supabase, user.id);

  return NextResponse.json({ family }, { status: 201 });
}
