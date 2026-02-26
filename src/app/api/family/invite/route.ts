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

  const family = await getCurrentFamily(supabase, user.id);
  if (!family) {
    return NextResponse.json(
      { error: "You are not in a family" },
      { status: 400 }
    );
  }

  const ownerMember = family.members.find((m) => m.user_id === user.id);
  if (!ownerMember || ownerMember.role !== "owner") {
    return NextResponse.json(
      { error: "Only the family owner can send invites" },
      { status: 403 }
    );
  }

  if (family.members.length >= 4) {
    return NextResponse.json(
      { error: "Family already has 4 members" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const email = (body.email || "").toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  if (email === user.email) {
    return NextResponse.json(
      { error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from("family_invites")
    .select("id")
    .eq("family_id", family.id)
    .eq("invite_email", email)
    .eq("status", "pending")
    .single();

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite has already been sent to this email" },
      { status: 400 }
    );
  }

  const { data: invite, error } = await supabase
    .from("family_invites")
    .insert({
      family_id: family.id,
      invited_by: user.id,
      invite_email: email,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invite }, { status: 201 });
}
