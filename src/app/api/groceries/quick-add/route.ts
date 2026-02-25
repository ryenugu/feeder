import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createApiKeyClient } from "@/lib/supabase/api-key";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  let userId: string | null = null;
  let useServiceRole = false;

  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    const result = await createApiKeyClient(apiKey);
    if (result) {
      userId = result.userId;
      useServiceRole = true;
    }
  }

  if (!userId) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id || null;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid session or x-api-key header." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const item = typeof body.item === "string" ? body.item.trim() : "";
  const store = typeof body.store === "string" ? body.store.trim() : "";

  if (!item) {
    return NextResponse.json({ error: "item is required" }, { status: 400 });
  }
  if (!store) {
    return NextResponse.json({ error: "store is required" }, { status: 400 });
  }

  const supabase = useServiceRole
    ? getServiceClient()
    : await createServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data: existingStores } = await supabase
    .from("grocery_stores")
    .select("id, name")
    .eq("user_id", userId);

  let storeId: string | null = null;

  if (existingStores && existingStores.length > 0) {
    const match = existingStores.find(
      (s: { id: string; name: string }) =>
        s.name.toLowerCase() === store.toLowerCase()
    );
    if (match) storeId = match.id;
  }

  if (!storeId) {
    const { data: newStore, error: storeErr } = await supabase
      .from("grocery_stores")
      .insert({
        user_id: userId,
        name: store,
        sort_order: existingStores ? existingStores.length : 0,
      })
      .select("id")
      .single();

    if (storeErr || !newStore) {
      return NextResponse.json(
        { error: storeErr?.message || "Failed to create store" },
        { status: 500 }
      );
    }
    storeId = newStore.id;
  }

  const { data: newItem, error: itemErr } = await supabase
    .from("grocery_items")
    .insert({
      user_id: userId,
      store_id: storeId,
      name: item,
      sort_order: 0,
    })
    .select()
    .single();

  if (itemErr || !newItem) {
    return NextResponse.json(
      { error: itemErr?.message || "Failed to add item" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, item: newItem.name, store, store_id: storeId },
    { status: 201 }
  );
}
