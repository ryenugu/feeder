import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const family = await getCurrentFamily(supabase, user.id);
  if (!family) {
    return NextResponse.json(
      { error: "You are not in a family" },
      { status: 400 }
    );
  }

  const myMember = family.members.find((m) => m.user_id === user.id);
  if (!myMember) {
    return NextResponse.json(
      { error: "You are not in a family" },
      { status: 400 }
    );
  }

  if (myMember.role === "owner" && family.members.length === 1) {
    // Owner alone — dissolve the whole family
    await supabase.from("families").delete().eq("id", family.id);
    return NextResponse.json({ success: true, dissolved: true });
  }

  if (myMember.role === "owner" && family.members.length > 1) {
    // Owner leaving with another member — promote the other member, then remove self
    const otherMember = family.members.find((m) => m.user_id !== user.id);
    if (otherMember) {
      await supabase
        .from("family_members")
        .update({ role: "owner" })
        .eq("id", otherMember.id);
    }
  }

  await supabase
    .from("family_members")
    .delete()
    .eq("user_id", user.id)
    .eq("family_id", family.id);

  return NextResponse.json({ success: true, dissolved: false });
}
