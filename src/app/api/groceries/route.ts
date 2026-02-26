import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  groceryStoreCreateSchema,
  groceryStoreUpdateSchema,
  groceryItemCreateSchema,
  groceryItemUpdateSchema,
} from "@/lib/validations";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: stores, error: storesError } = await supabase
    .from("grocery_stores")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (storesError) {
    return NextResponse.json({ error: storesError.message }, { status: 500 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("grocery_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const storesWithItems = stores.map((store) => ({
    ...store,
    items: items.filter((item) => item.store_id === store.id),
  }));

  return NextResponse.json(storesWithItems);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, ...rest } = body;

  if (type === "store") {
    const parsed = groceryStoreCreateSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("grocery_stores")
      .insert({ user_id: user.id, ...parsed.data })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ...data, items: [] }, { status: 201 });
  }

  if (type === "item") {
    const parsed = groceryItemCreateSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("grocery_items")
      .insert({ user_id: user.id, ...parsed.data })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type, must be 'store' or 'item'" }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, ...rest } = body;

  if (type === "reset-all") {
    const { error } = await supabase
      .from("grocery_items")
      .update({ checked: false })
      .eq("checked", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (type === "store") {
    const parsed = groceryStoreUpdateSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const { data, error } = await supabase
      .from("grocery_stores")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  if (type === "item") {
    const parsed = groceryItemUpdateSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const { data, error } = await supabase
      .from("grocery_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Invalid type, must be 'store' or 'item'" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");

  if (!id || !type) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }

  const table = type === "store" ? "grocery_stores" : type === "item" ? "grocery_items" : null;

  if (!table) {
    return NextResponse.json({ error: "Invalid type, must be 'store' or 'item'" }, { status: 400 });
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
