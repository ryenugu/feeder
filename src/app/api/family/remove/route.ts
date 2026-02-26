import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFamily } from "@/lib/family";

export async function DELETE(request: NextRequest) {
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
  if (!myMember || myMember.role !== "owner") {
    return NextResponse.json(
      { error: "Only the family owner can remove members" },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const targetUserId = url.searchParams.get("user_id");

  if (!targetUserId) {
    return NextResponse.json(
      { error: "user_id parameter is required" },
      { status: 400 }
    );
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "You cannot remove yourself. Use leave instead." },
      { status: 400 }
    );
  }

  const targetMember = family.members.find((m) => m.user_id === targetUserId);
  if (!targetMember) {
    return NextResponse.json(
      { error: "User is not in your family" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("user_id", targetUserId)
    .eq("family_id", family.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
